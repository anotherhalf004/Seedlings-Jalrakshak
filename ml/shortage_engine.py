"""
JalRakshak ML Pipeline - Phase 3: Target Definition & Shortage Estimation Engine
================================================================================
Implements:
1. Deterministic shortage amount calculation: max(0, predicted_demand - predicted_supply)
2. Shortage percentage calculation: 100 * shortage_amount / predicted_demand
3. Configurable risk tier categorization: Low, Medium, High, Critical
4. Validation and unit consistency checks (MLD - Million Liters per Day)
"""

import json
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DEFAULT_SHORTAGE_CONFIG = {
    "units": "MLD",
    "risk_thresholds_pct": {
        "low_max": 10.0,       # < 10% shortage is Low Risk (Operational buffer sufficient)
        "medium_max": 25.0,    # 10% - 25% shortage is Medium Risk (Managed rotation required)
        "high_max": 40.0,      # 25% - 40% shortage is High Risk (Severe supply rationing)
        "critical_min": 40.0   # >= 40% shortage is Critical Crisis Tier
    },
    "cpheeo_benchmark_lpcd": 135.0,
    "non_domestic_factor": 1.15
}

def load_shortage_config(config_path=None):
    """Load configurable thresholds from JSON or fallback to defaults."""
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), "shortage_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                config = json.load(f)
                logger.info(f"Loaded shortage config from {config_path}")
                return config
        except Exception as e:
            logger.warning(f"Failed to load config from {config_path}, using defaults: {str(e)}")
            return DEFAULT_SHORTAGE_CONFIG
    logger.info(f"Config file not found at {config_path}, using defaults")
    return DEFAULT_SHORTAGE_CONFIG


def compute_shortage(predicted_demand_mld: float, predicted_supply_mld: float, config=None):
    """
    Computes deterministic water shortage metrics.
    
    Parameters:
    - predicted_demand_mld (float): Forecasted water demand in MLD.
    - predicted_supply_mld (float): Forecasted available water supply in MLD.
    - config (dict): Optional custom configuration dictionary.
    
    Returns:
    - dict: Shortage amount (MLD), shortage percentage (%), risk tier, and advisory.
    """
    if config is None:
        config = DEFAULT_SHORTAGE_CONFIG
        
    thresholds = config.get("risk_thresholds_pct", DEFAULT_SHORTAGE_CONFIG["risk_thresholds_pct"])
    
    # Enforce non-negative physics constraints
    demand = max(0.0, float(predicted_demand_mld))
    supply = max(0.0, float(predicted_supply_mld))
    
    shortage_amount = max(0.0, demand - supply)
    shortage_pct = (shortage_amount / demand * 100.0) if demand > 0 else 0.0
    
    if shortage_pct >= thresholds["critical_min"]:
        risk_tier = "Critical"
        advisory = "CRITICAL WATER CRISIS: Immediate emergency reservoir inter-basin transfer, tanker deployment, and industrial rationing required."
    elif shortage_pct >= thresholds["medium_max"]:
        risk_tier = "High"
        advisory = "HIGH WATER STRESS: Mandate alternate-day municipal supply scheduling, strict borehole regulation, and non-revenue water inspection."
    elif shortage_pct >= thresholds["low_max"]:
        risk_tier = "Medium"
        advisory = "MODERATE DEFICIT: Implement pressure management in feeder lines and optimize water treatment plant output."
    else:
        risk_tier = "Low"
        advisory = "NORMAL OPERATING RANGE: Water supply is adequate to satisfy estimated design demand."
        
    return {
        "predicted_demand_mld": round(demand, 2),
        "predicted_supply_mld": round(supply, 2),
        "shortage_amount_mld": round(shortage_amount, 2),
        "shortage_percentage": round(shortage_pct, 2),
        "risk_tier": risk_tier,
        "advisory": advisory,
        "unit": config.get("units", "MLD")
    }

if __name__ == "__main__":
    # Test example
    os.makedirs("ml", exist_ok=True)
    with open("ml/shortage_config.json", "w") as f:
        json.dump(DEFAULT_SHORTAGE_CONFIG, f, indent=2)
        
    res = compute_shortage(250.0, 175.0)
    print("Sample Shortage Computation:")
    print(json.dumps(res, indent=2))
