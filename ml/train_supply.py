"""
JalRakshak ML Pipeline - Phase 5: Water Supply Ratio Forecasting Model Training
================================================================================
Trains regression models to forecast the Municipal Water Supply Ratio:
    supply_ratio = estimated_supply_mld / benchmark_demand_mld
integrating groundwater stress, rainfall departures, and tap water infrastructure.

Supply capacity (MLD) is subsequently derived as:
    predicted_supply_mld = predicted_demand_mld * predicted_supply_ratio

Model selection is conducted using Repeated Stratified 5-Fold Cross-Validation
across all monitored cities, evaluating exact accuracy, within-1-tier accuracy,
and shortage percentage MAE.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import RepeatedStratifiedKFold
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
    HistGradientBoostingRegressor
)
from sklearn.linear_model import Ridge
from sklearn.dummy import DummyRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

from shortage_engine import compute_shortage

TIER_ORDER = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}

def train_water_supply_models():
    os.makedirs("models", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    # Load master dataset
    df = pd.read_csv("data/processed/jalrakshak_master.csv")
    
    feature_cols = [
        "population_estimated",
        "gw_fall_pct",
        "gw_fall_gt_4m_pct",
        "gw_rise_pct",
        "state_tap_water_coverage_pct",
        "rainfall_period_actual_mm",
        "rainfall_period_dep_pct",
        "groundwater_stress_index"
    ]
    
    demand_features = [
        "population_estimated",
        "state_tap_water_coverage_pct",
        "monitoring_wells_count"
    ]
    
    # Target: Supply Delivery Ratio (normalized between 0 and 1)
    df["supply_ratio"] = df["estimated_supply_mld"] / df["benchmark_demand_mld"]
    X = df[feature_cols]
    y_ratio = df["supply_ratio"]
    strat_labels = df["shortage_risk_category"]
    
    # Define candidate supply ratio models
    models = {
        "Baseline_Mean": DummyRegressor(strategy="mean"),
        "Ridge_Linear": Pipeline([("scaler", StandardScaler()), ("model", Ridge(alpha=1.0))]),
        "Random_Forest": RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42),
        "Hist_Gradient_Boosting": HistGradientBoostingRegressor(max_iter=100, max_depth=3, random_state=42),
        "Gradient_Boosting": GradientBoostingRegressor(
            n_estimators=100,
            max_depth=2,
            learning_rate=0.1,
            random_state=42
        )
    }
    
    print("\n" + "="*80)
    print("WATER SUPPLY RATIO MODEL SELECTION (REPEATED STRATIFIED 5-FOLD CV)")
    print("All 69 Cities | Stratified by Shortage Risk Tier | 5 Repeats x 5 Folds")
    print("="*80)
    
    rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=42)
    results = {}
    
    for name, model in models.items():
        exact_accs = []
        within_1_accs = []
        shortage_pct_maes = []
        ratio_maes = []
        derived_supply_maes = []
        
        for train_idx, test_idx in rskf.split(df, strat_labels):
            train_df, test_df = df.iloc[train_idx], df.iloc[test_idx]
            
            # 1. Fit demand model on training fold
            d_pipeline = Pipeline([("scaler", StandardScaler()), ("model", Ridge(alpha=1.0))])
            d_pipeline.fit(train_df[demand_features], train_df["benchmark_demand_mld"])
            pred_demand = d_pipeline.predict(test_df[demand_features])
            
            # 2. Fit candidate supply ratio model on training fold
            model.fit(train_df[feature_cols], train_df["supply_ratio"])
            pred_ratio = model.predict(test_df[feature_cols])
            
            # Constrain ratio to physical boundaries [0.10, 1.0]
            pred_ratio = np.clip(pred_ratio, 0.10, 1.0)
            
            # 3. Derive supply MLD
            pred_supply = pred_demand * pred_ratio
            
            # 4. Compute shortage and risk tiers
            true_tiers = test_df["shortage_risk_category"].values
            true_pcts = test_df["shortage_percentage"].values
            
            fold_pred_tiers = []
            fold_pred_pcts = []
            for d, s in zip(pred_demand, pred_supply):
                sh = compute_shortage(d, s)
                fold_pred_tiers.append(sh["risk_tier"])
                fold_pred_pcts.append(sh["shortage_percentage"])
                
            exact_acc = np.mean([t == p for t, p in zip(true_tiers, fold_pred_tiers)])
            w1_acc = np.mean([abs(TIER_ORDER[t] - TIER_ORDER[p]) <= 1 for t, p in zip(true_tiers, fold_pred_tiers)])
            s_mae = np.mean(np.abs(true_pcts - fold_pred_pcts))
            r_mae = mean_absolute_error(test_df["supply_ratio"], pred_ratio)
            s_mld_mae = mean_absolute_error(test_df["estimated_supply_mld"], pred_supply)
            
            exact_accs.append(exact_acc)
            within_1_accs.append(w1_acc)
            shortage_pct_maes.append(s_mae)
            ratio_maes.append(r_mae)
            derived_supply_maes.append(s_mld_mae)
            
        results[name] = {
            "exact_accuracy_pct": round(float(np.mean(exact_accs) * 100), 2),
            "within_1_tier_accuracy_pct": round(float(np.mean(within_1_accs) * 100), 2),
            "shortage_percentage_mae": round(float(np.mean(shortage_pct_maes)), 2),
            "ratio_mae": round(float(np.mean(ratio_maes)), 4),
            "derived_supply_mae_mld": round(float(np.mean(derived_supply_maes)), 2)
        }
        
        print(f"[{name:24}] -> Exact Acc: {results[name]['exact_accuracy_pct']:5.2f}% | "
              f"Within-1-Tier: {results[name]['within_1_tier_accuracy_pct']:5.2f}% | "
              f"Shortage-% MAE: {results[name]['shortage_percentage_mae']:4.2f}% | "
              f"Supply MAE: {results[name]['derived_supply_mae_mld']:5.2f} MLD")
              
    # Automatically select the best model based on highest exact accuracy and lowest shortage-% MAE
    best_model_name = "Gradient_Boosting"
    if "Gradient_Boosting" in results and "Ridge_Linear" in results:
        # Check candidate models
        sorted_models = sorted(
            [m for m in models.keys() if m != "Baseline_Mean"],
            key=lambda k: (results[k]["exact_accuracy_pct"], -results[k]["shortage_percentage_mae"]),
            reverse=True
        )
        best_model_name = sorted_models[0]
        
    print(f"\n[+] Selected Best Model via Repeated Stratified 5-Fold CV: {best_model_name}")
    print(f"    - Exact Accuracy: {results[best_model_name]['exact_accuracy_pct']}%")
    print(f"    - Within-1-Tier Accuracy: {results[best_model_name]['within_1_tier_accuracy_pct']}%")
    print(f"    - Shortage-% MAE: {results[best_model_name]['shortage_percentage_mae']}%")
    
    # Train the chosen best model on the complete master dataset
    best_pipeline = models[best_model_name]
    best_pipeline.fit(X, y_ratio)
    
    model_path = "models/supply_model.joblib"
    joblib.dump({
        "model": best_pipeline,
        "features": feature_cols,
        "target": "supply_ratio",
        "model_type": "supply_ratio",
        "best_model_name": best_model_name,
        "cv_results": results
    }, model_path)
    
    print(f"[+] Saved production supply ratio model to '{model_path}'")
    
    with open("reports/supply_model_metrics.json", "w") as f:
        json.dump(results, f, indent=2)
        
    return results, best_model_name

if __name__ == "__main__":
    train_water_supply_models()

