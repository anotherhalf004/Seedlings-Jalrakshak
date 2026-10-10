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
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

# Add ml folder to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml")))
from predict import predict_water_crisis
from shortage_engine import compute_shortage, load_shortage_config

app = FastAPI(
    title="JalRakshak API — Smart Water Crisis & Leakage Prevention",
    description="All-India Municipal Water Forecasting & Loss Anomaly Engine",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load master dataset for pre-computed city queries
MASTER_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "final", "jalrakshak_master.csv"))

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
    city: str = Field(..., example="Bengaluru")
    population: Optional[float] = Field(None, example=8443675)
    gw_fall_pct: Optional[float] = Field(50.0, example=91.67, description="% of wells showing water level drop")
    gw_fall_gt_4m_pct: Optional[float] = Field(0.0, example=20.83, description="% of wells with >4m drop")
    gw_rise_pct: Optional[float] = Field(0.0, example=8.33, description="% of wells rising")
    state_tap_water_coverage_pct: Optional[float] = Field(85.0, example=89.70, description="Tap connection coverage %")
    rainfall_period_actual_mm: Optional[float] = Field(20.0, example=43.2, description="Recorded rainfall mm")
    rainfall_period_dep_pct: Optional[float] = Field(-15.0, example=-11.0, description="Rainfall departure %")
    monitoring_wells_count: Optional[int] = Field(10, example=24)
    forecast_period: Optional[str] = Field("Upcoming Month", example="Upcoming Month")

class SimulatorRequest(BaseModel):
    city: str = Field(..., example="Bengaluru")
    current_nrw_loss_pct: float = Field(20.0, example=20.0, description="Current Non-Revenue Water loss percentage")
    target_nrw_loss_pct: float = Field(10.0, example=10.0, description="Target reduced loss percentage")
    demand_mld: Optional[float] = Field(None, example=1310.88)
    supply_mld: Optional[float] = Field(None, example=881.52)

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
def predict(request: PredictionRequest):
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
def what_if_simulator(req: SimulatorRequest):
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
