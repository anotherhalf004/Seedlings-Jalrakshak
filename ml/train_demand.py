"""
JalRakshak ML Pipeline - Phase 5: Water Demand Forecasting Model Training
=========================================================================
Trains and evaluates regression models to predict municipal water demand (MLD)
based on population scale, urban density proxy, and infrastructure factors.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import KFold, cross_validate
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.dummy import DummyRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

def train_water_demand_models():
    os.makedirs("models", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    # Load master dataset
    df = pd.read_csv("data/processed/jalrakshak_master.csv")
    
    feature_cols = [
        "population_estimated",
        "state_tap_water_coverage_pct",
        "monitoring_wells_count"
    ]
    target_col = "benchmark_demand_mld"
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Define models
    baseline = DummyRegressor(strategy="mean")
    ridge_pipeline = Pipeline([("scaler", StandardScaler()), ("model", Ridge(alpha=1.0))])
    rf_model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    hgb_model = HistGradientBoostingRegressor(max_iter=100, max_depth=4, random_state=42)
    
    models = {
        "Baseline_Mean": baseline,
        "Ridge_Linear": ridge_pipeline,
        "Random_Forest": rf_model,
        "Hist_Gradient_Boosting": hgb_model
    }
    
    results = {}
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    
    print("\n" + "="*70)
    print("WATER DEMAND MODEL TRAINING & CROSS-VALIDATION EVALUATION")
    print("="*70)
    
    best_model_name = None
    best_rmse = float("inf")
    
    for name, model in models.items():
        scoring = ['neg_mean_absolute_error', 'neg_root_mean_squared_error', 'r2']
        cv_res = cross_validate(model, X, y, cv=cv, scoring=scoring, return_train_score=False)
        
        mae = -cv_res['test_neg_mean_absolute_error'].mean()
        rmse = -cv_res['test_neg_root_mean_squared_error'].mean()
        r2 = cv_res['test_r2'].mean()
        
        results[name] = {
            "MAE_MLD": round(float(mae), 3),
            "RMSE_MLD": round(float(rmse), 3),
            "R2_Score": round(float(r2), 4)
        }
        
        print(f"[{name}] -> MAE: {mae:.2f} MLD | RMSE: {rmse:.2f} MLD | R2: {r2:.4f}")
        
        if rmse < best_rmse and name != "Baseline_Mean":
            best_rmse = rmse
            best_model_name = name
            
    # Train the best model on full data and save
    best_pipeline = models[best_model_name]
    best_pipeline.fit(X, y)
    model_path = "models/demand_model.joblib"
    joblib.dump({
        "model": best_pipeline,
        "features": feature_cols,
        "target": target_col,
        "best_model_name": best_model_name
    }, model_path)
    
    print(f"\n[+] Best Model: {best_model_name} saved to '{model_path}'")
    
    with open("reports/demand_model_metrics.json", "w") as f:
        json.dump(results, f, indent=2)
        
    return results, best_model_name

if __name__ == "__main__":
    train_water_demand_models()
