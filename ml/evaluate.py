"""
JalRakshak ML Pipeline - Phase 6: Rigorous Model Evaluation & Metrics Generator
================================================================================
Evaluates:
1. Demand Forecasting Models (MAE, RMSE, R2 vs Baseline).
2. Supply Forecasting Models (MAE, RMSE, R2 vs Baseline).
3. Shortage Risk Classification Metrics (Precision, Recall, F1, Support).
4. City-wise actual vs predicted values on held-out test splits.
5. Saves evaluation metrics to `reports/evaluation_metrics.json` and predictions to `reports/test_predictions.csv`.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.dummy import DummyRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    classification_report,
    confusion_matrix
)
from shortage_engine import compute_shortage

def run_evaluation():
    os.makedirs("reports", exist_ok=True)
    df = pd.read_csv("data/processed/jalrakshak_master.csv")
    
    # 80/20 train/test split preserving state representation
    train_df, test_df = train_test_split(df, test_size=0.20, random_state=42)
    
    # --- 1. EVALUATE DEMAND ---
    demand_features = ["population_estimated", "state_tap_water_coverage_pct", "monitoring_wells_count"]
    X_train_d, y_train_d = train_df[demand_features], train_df["benchmark_demand_mld"]
    X_test_d, y_test_d = test_df[demand_features], test_df["benchmark_demand_mld"]
    
    # Baseline
    dummy_d = DummyRegressor(strategy="mean")
    dummy_d.fit(X_train_d, y_train_d)
    pred_dummy_d = dummy_d.predict(X_test_d)
    
    # Ridge
    ridge_d = Pipeline([("scaler", StandardScaler()), ("model", Ridge(alpha=1.0))])
    ridge_d.fit(X_train_d, y_train_d)
    pred_ridge_d = ridge_d.predict(X_test_d)
    
    # Random Forest
    rf_d = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    rf_d.fit(X_train_d, y_train_d)
    pred_rf_d = rf_d.predict(X_test_d)
    
    # --- 2. EVALUATE SUPPLY ---
    supply_features = [
        "population_estimated", "gw_fall_pct", "gw_fall_gt_4m_pct", "gw_rise_pct",
        "state_tap_water_coverage_pct", "rainfall_period_actual_mm", "rainfall_period_dep_pct",
        "groundwater_stress_index"
    ]
    X_train_s, y_train_s = train_df[supply_features], train_df["estimated_supply_mld"]
    X_test_s, y_test_s = test_df[supply_features], test_df["estimated_supply_mld"]
    
    # Baseline
    dummy_s = DummyRegressor(strategy="mean")
    dummy_s.fit(X_train_s, y_train_s)
    pred_dummy_s = dummy_s.predict(X_test_s)
    
    # Random Forest
    rf_s = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    rf_s.fit(X_train_s, y_train_s)
    pred_rf_s = rf_s.predict(X_test_s)
    
    # Ridge
    ridge_s = Pipeline([("scaler", StandardScaler()), ("model", Ridge(alpha=1.0))])
    ridge_s.fit(X_train_s, y_train_s)
    pred_ridge_s = ridge_s.predict(X_test_s)
    
    # Compute test metrics
    def calc_metrics(y_true, y_pred):
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        r2 = r2_score(y_true, y_pred)
        return {"MAE_MLD": round(float(mae), 3), "RMSE_MLD": round(float(rmse), 3), "R2": round(float(r2), 4)}
        
    demand_metrics = {
        "Baseline_Mean": calc_metrics(y_test_d, pred_dummy_d),
        "Ridge_Linear": calc_metrics(y_test_d, pred_ridge_d),
        "Random_Forest": calc_metrics(y_test_d, pred_rf_d)
    }
    
    supply_metrics = {
        "Baseline_Mean": calc_metrics(y_test_s, pred_dummy_s),
        "Ridge_Linear": calc_metrics(y_test_s, pred_ridge_s),
        "Random_Forest": calc_metrics(y_test_s, pred_rf_s)
    }
    
    # --- 3. TEST PREDICTIONS & SHORTAGE RISK EVALUATION ---
    test_results = test_df.copy()
    test_results["pred_demand_mld"] = np.round(pred_rf_d, 2)
    test_results["pred_supply_mld"] = np.round(pred_rf_s, 2)
    
    # Shortage predictions
    pred_shortage_amounts = []
    pred_shortage_pcts = []
    pred_risk_tiers = []
    
    for _, row in test_results.iterrows():
        sh = compute_shortage(row["pred_demand_mld"], row["pred_supply_mld"])
        pred_shortage_amounts.append(sh["shortage_amount_mld"])
        pred_shortage_pcts.append(sh["shortage_percentage"])
        pred_risk_tiers.append(sh["risk_tier"])
        
    test_results["pred_shortage_mld"] = pred_shortage_amounts
    test_results["pred_shortage_pct"] = pred_shortage_pcts
    test_results["pred_risk_tier"] = pred_risk_tiers
    
    # Classification Report
    cls_report = classification_report(
        test_results["shortage_risk_category"],
        test_results["pred_risk_tier"],
        output_dict=True,
        zero_division=0
    )
    
    # Save test predictions table
    pred_out_cols = [
        "city", "state_ut", "benchmark_demand_mld", "pred_demand_mld",
        "estimated_supply_mld", "pred_supply_mld", "estimated_shortage_mld", "pred_shortage_mld",
        "shortage_percentage", "pred_shortage_pct", "shortage_risk_category", "pred_risk_tier"
    ]
    test_preds_csv = "reports/test_predictions.csv"
    test_results[pred_out_cols].to_csv(test_preds_csv, index=False)
    
    # Aggregate full metrics
    full_metrics = {
        "evaluation_dataset_size": len(df),
        "held_out_test_set_size": len(test_df),
        "train_set_size": len(train_df),
        "demand_model_evaluation": demand_metrics,
        "supply_model_evaluation": supply_metrics,
        "shortage_classification_evaluation": cls_report
    }
    
    with open("reports/evaluation_metrics.json", "w") as f:
        json.dump(full_metrics, f, indent=2)
        
    print("\n" + "="*80)
    print("PHASE 6 RIGOROUS EVALUATION RESULTS:")
    print("="*80)
    print("\n[Demand Forecasting on Held-Out Test Set]:")
    print(pd.DataFrame(demand_metrics).T)
    print("\n[Supply Forecasting on Held-Out Test Set]:")
    print(pd.DataFrame(supply_metrics).T)
    print("\n[Shortage Risk Classification Accuracy]:")
    print(f"Overall Test Accuracy: {cls_report.get('accuracy', 0.0)*100:.2f}%")
    print(f"[+] Detailed test predictions exported to '{test_preds_csv}'")
    print(f"[+] Full metrics JSON saved to 'reports/evaluation_metrics.json'")
    print("="*80)
    
    return full_metrics

if __name__ == "__main__":
    run_evaluation()
