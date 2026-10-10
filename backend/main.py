"""
JalRakshak Backend API — FastAPI Service (Phase 15)
===================================================
Production-grade REST API powering the JalRakshak National Dashboard:
1. GET  /api/v1/health    - Health check
2. GET  /api/v1/cities    - Returns all 66 Indian cities with groundwater, rainfall & water stress status
3. POST /api/v1/predict   - Core ML demand, supply, shortage risk, and water-loss prediction
4. POST /api/v1/simulate  - Hackathon 'What-If' water conservation and NRW reduction simulator
"""

import os
import sys
import logging
import time
from collections import defaultdict
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
import pandas as pd
import numpy as np
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add ml folder to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml")))
from predict import predict_water_crisis
from shortage_engine import compute_shortage, load_shortage_config

app = FastAPI(
    title="JalRakshak API — Smart Water Crisis & Leakage Prevention",
    description="All-India Municipal Water Forecasting & Loss Anomaly Engine",
    version="1.0.0"
)

# Configure CORS with environment variable fallback
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # Changed to False for security
    allow_methods=["GET", "POST"],  # Restrict to required methods
    allow_headers=["Content-Type"],  # Restrict to required headers
)

# Trusted Host middleware for production
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=ALLOWED_HOSTS
    )

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# HTTPS enforcement for production
@app.middleware("http")
async def redirect_to_https(request: Request, call_next):
    if os.getenv("ENVIRONMENT") == "production":
        if request.url.scheme == "http" and not ("localhost" in request.url.hostname or "127.0.0.1" in request.url.hostname):
            return RedirectResponse(url=str(request.url).replace("http://", "https://"), status_code=301)
    return await call_next(request)

# Simple in-memory rate limiter
class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.max_requests = int(os.getenv("RATE_LIMIT_MAX", "100"))
        self.window_seconds = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        # Remove old requests outside the window
        self.requests[client_ip] = [req_time for req_time in self.requests[client_ip] if now - req_time < self.window_seconds]
        
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        
        self.requests[client_ip].append(now)
        return True

rate_limiter = RateLimiter()

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health check in development
    if os.getenv("ENVIRONMENT") != "production" and request.url.path == "/api/v1/health":
        return await call_next(request)
    
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Too many requests")
    
    return await call_next(request)

# API Key Authentication (optional, enabled via env var)
security = HTTPBearer(auto_error=False)

async def verify_api_key(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Verify API key if API_KEY environment variable is set."""
    api_key = os.getenv("API_KEY")
    if not api_key:
        # No API key required
        return None
    
    if not credentials or credentials.credentials != api_key:
        logger.warning(f"Invalid API key attempt from IP: {credentials}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )
    
    return credentials.credentials

# Load master dataset for pre-computed city queries (use env var with fallback)
MASTER_DATA_PATH = os.getenv(
    "MASTER_DATA_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "final", "jalrakshak_master.csv"))
)

def get_master_df():
    if os.path.exists(MASTER_DATA_PATH):
        return pd.read_csv(MASTER_DATA_PATH)
    return pd.DataFrame()

def find_city_in_df(df: pd.DataFrame, city_name: str):
    """Finds a matching city row handling formatting, parentheses, and common aliases."""
    if df.empty or not city_name:
        return None
    target = city_name.strip().lower()
    # 1. Exact case-insensitive match
    match = df[df["city"].str.lower() == target]
    if not match.empty:
        return match.iloc[0]
    # 2. Match without parenthesis (e.g. "Patna" -> "Patna (phreatic)")
    clean_series = df["city"].str.replace(r"\s*\(.*?\)", "", regex=True).str.strip().str.lower()
    match = df[clean_series == target]
    if not match.empty:
        return match.iloc[0]
    # 3. Known Indian city alias matching
    aliases = {
        "bengaluru": "bangalore",
        "bangalore": "bengaluru",
        "gurgaon": "gurugram",
        "gurugram": "gurgaon",
        "mysore": "mysuru",
        "mysuru": "mysore",
        "allahabad": "prayagraj",
        "prayagraj": "allahabad"
    }
    alt = aliases.get(target)
    if alt:
        match = df[clean_series == alt]
        if not match.empty:
            return match.iloc[0]
        match = df[df["city"].str.lower().str.contains(alt, regex=False)]
        if not match.empty:
            return match.iloc[0]
    # 4. Substring match
    match = df[clean_series.str.contains(target, regex=False)]
    if not match.empty:
        return match.iloc[0]
    return None

# ----------------- PYDANTIC SCHEMAS -----------------

class PredictionRequest(BaseModel):
    city: str = Field(..., min_length=1, max_length=100, description="City name")
    population: Optional[float] = Field(None, ge=0, description="Population count")
    gw_fall_pct: Optional[float] = Field(50.0, ge=0, le=100, description="% of wells showing water level drop")
    gw_fall_gt_4m_pct: Optional[float] = Field(0.0, ge=0, le=100, description="% of wells with >4m drop")
    gw_rise_pct: Optional[float] = Field(0.0, ge=0, le=100, description="% of wells rising")
    state_tap_water_coverage_pct: Optional[float] = Field(85.0, ge=0, le=100, description="Tap connection coverage %")
    rainfall_period_actual_mm: Optional[float] = Field(20.0, ge=0, description="Recorded rainfall mm")
    rainfall_period_dep_pct: Optional[float] = Field(-15.0, ge=-100, le=200, description="Rainfall departure %")
    monitoring_wells_count: Optional[int] = Field(10, ge=1, le=1000, description="Number of monitoring wells")
    forecast_period: Optional[str] = Field("Upcoming Month", description="Forecast period")

    @field_validator('city')
    @classmethod
    def validate_city_name(cls, v: str) -> str:
        """Validate city name contains only allowed characters."""
        if not v or not v.strip():
            raise ValueError("City name cannot be empty")
        # Allow letters, spaces, hyphens, and parentheses
        if not all(c.isalnum() or c in ' -()' for c in v):
            raise ValueError("City name contains invalid characters")
        return v.strip()

class SimulatorRequest(BaseModel):
    city: str = Field(..., min_length=1, max_length=100, description="City name")
    current_nrw_loss_pct: float = Field(20.0, ge=0, le=100, description="Current Non-Revenue Water loss percentage")
    target_nrw_loss_pct: float = Field(10.0, ge=0, le=100, description="Target reduced loss percentage")
    demand_mld: Optional[float] = Field(None, ge=0, description="Demand in MLD")
    supply_mld: Optional[float] = Field(None, ge=0, description="Supply in MLD")

    @field_validator('city')
    @classmethod
    def validate_city_name(cls, v: str) -> str:
        """Validate city name contains only allowed characters."""
        if not v or not v.strip():
            raise ValueError("City name cannot be empty")
        if not all(c.isalnum() or c in ' -()' for c in v):
            raise ValueError("City name contains invalid characters")
        return v.strip()

    @field_validator('target_nrw_loss_pct')
    @classmethod
    def validate_target_less_than_current(cls, v: float, info) -> float:
        """Ensure target NRW is not greater than current NRW."""
        if 'current_nrw_loss_pct' in info.data and v > info.data['current_nrw_loss_pct']:
            raise ValueError("Target NRW loss percentage must be less than or equal to current NRW loss percentage")
        return v

# ----------------- ENDPOINTS -----------------

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JalRakshak All-India Water Analytics API",
        "scope": "National (66 Urban Cities, 35 States/UTs)",
        "version": "1.0.0"
    }

@app.get("/api/v1/cities")
def list_cities():
    """Returns overview list of all 66 monitored Indian cities."""
    df = get_master_df()
    if df.empty:
        raise HTTPException(status_code=500, detail="Master dataset not found.")
        
    records = df.replace({np.nan: None}).to_dict(orient="records")
    
    return {
        "total_cities": len(records),
        "cities": records
    }

@app.post("/api/v1/predict")
def predict(request: PredictionRequest, api_key: Optional[str] = Depends(verify_api_key)):
    """Generates demand, supply, shortage risk, and loss diagnostics for any city."""
    df = get_master_df()
    
    # Auto-fill defaults from master dataset if city exists
    pop = request.population
    gw_fall = request.gw_fall_pct
    tap_pct = request.state_tap_water_coverage_pct
    rain_dep = request.rainfall_period_dep_pct
    
    if not df.empty:
        matched_row = find_city_in_df(df, request.city)
        if matched_row is not None:
            if pop is None:
                pop = float(matched_row["population_estimated"])
            if gw_fall == 50.0:
                gw_fall = float(matched_row["gw_fall_pct"])
            if tap_pct == 85.0:
                tap_pct = float(matched_row["state_tap_water_coverage_pct"])
            if rain_dep == -15.0:
                rain_dep = float(matched_row["rainfall_period_dep_pct"])
                
    pop = pop or 1000000.0
    
    pred_res = predict_water_crisis(
        city=request.city,
        population=pop,
        gw_fall_pct=gw_fall,
        gw_fall_gt_4m_pct=request.gw_fall_gt_4m_pct,
        gw_rise_pct=request.gw_rise_pct,
        state_tap_water_coverage_pct=tap_pct,
        rainfall_period_actual_mm=request.rainfall_period_actual_mm,
        rainfall_period_dep_pct=rain_dep,
        monitoring_wells_count=request.monitoring_wells_count,
        forecast_period=request.forecast_period
    )
    return pred_res

@app.post("/api/v1/simulate")
def what_if_simulator(req: SimulatorRequest, api_key: Optional[str] = Depends(verify_api_key)):
    """
    Simulates water savings and crisis risk downgrade when reducing water losses (Phase 20).
    """
    df = get_master_df()
    demand = req.demand_mld
    supply = req.supply_mld
    
    if (demand is None or supply is None) and not df.empty:
        matched_row = find_city_in_df(df, req.city)
        if matched_row is not None:
            demand = float(matched_row["benchmark_demand_mld"])
            supply = float(matched_row["estimated_supply_mld"])
            
    demand = demand or 500.0
    supply = supply or 350.0

    
    initial_shortage = max(0.0, demand - supply)
    initial_shortage_pct = (initial_shortage / demand * 100.0) if demand > 0 else 0.0
    
    # Calculate water saved through non-revenue water recovery
    loss_reduction_pct = max(0.0, req.current_nrw_loss_pct - req.target_nrw_loss_pct)
    water_saved_mld = round(supply * (loss_reduction_pct / 100.0), 2)
    
    # Effective supply with recovered distribution losses
    improved_supply_mld = round(supply + water_saved_mld, 2)
    new_shortage_mld = max(0.0, round(demand - improved_supply_mld, 2))
    new_shortage_pct = round((new_shortage_mld / demand * 100.0), 2) if demand > 0 else 0.0
    shortage_reduction_pct = round(initial_shortage_pct - new_shortage_pct, 2)
    
    # Determine risk transitions
    def get_tier(pct):
        if pct >= 40.0: return "Critical"
        if pct >= 25.0: return "High"
        if pct >= 10.0: return "Medium"
        return "Low"
        
    old_tier = get_tier(initial_shortage_pct)
    new_tier = get_tier(new_shortage_pct)
    
    return {
        "city": req.city,
        "simulation_disclaimer": "Estimated using modelled scenario; not an observed measurement.",
        "baseline": {
            "demand_mld": demand,
            "current_supply_mld": supply,
            "current_nrw_loss_pct": req.current_nrw_loss_pct,
            "initial_shortage_mld": round(initial_shortage, 2),
            "initial_shortage_pct": round(initial_shortage_pct, 2),
            "initial_risk_tier": old_tier
        },
        "simulation_results": {
            "target_nrw_loss_pct": req.target_nrw_loss_pct,
            "water_saved_mld": water_saved_mld,
            "improved_effective_supply_mld": improved_supply_mld,
            "new_shortage_mld": new_shortage_mld,
            "new_shortage_pct": new_shortage_pct,
            "shortage_reduction_pct_points": shortage_reduction_pct,
            "new_risk_tier": new_tier,
            "risk_status_change": f"{old_tier} -> {new_tier}"
        },
        "impact_summary": f"Reducing water loss by {loss_reduction_pct:.1f}% saves {water_saved_mld} MLD and reduces shortage by {shortage_reduction_pct:.1f}% points."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
