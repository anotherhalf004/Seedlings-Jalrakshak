"""
JalRakshak ML Pipeline - Phase 6: Production Model Evaluation & Metrics Generator
================================================================================
Evaluates saved production models ('models/demand_model.joblib' and 'models/supply_model.joblib'):
1. Demand Forecasting (Ridge Linear Regression vs Baseline).
2. Water Supply Ratio & Derived Supply MLD (Gradient Boosting Regressor vs Baseline).
3. Shortage Risk Classification:
   - Exact Risk Tier Accuracy (Low, Medium, High, Critical)
   - Within-One-Tier Accuracy (tolerance for adjacent risk categories)
   - Shortage Percentage MAE (Mean Absolute Error on shortage %)
   - Per-tier Precision, Recall, F1-Score
4. Saves full evaluation metrics to `reports/evaluation_metrics.json`
   and detailed city predictions to `reports/test_predictions.csv`.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.dummy import DummyRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    classification_report,
    confusion_matrix
)
import joblib

from shortage_engine import compute_shortage

TIER_ORDER = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}

def run_evaluation():
    os.makedirs("reports", exist_ok=True)
    
    demand_model_path = "models/demand_model.joblib"
    supply_model_path = "models/supply_model.joblib"
    
    if not os.path.exists(demand_model_path) or not os.path.exists(supply_model_path):
        raise FileNotFoundError(
            "Trained models not found. Please run 'python ml/train_demand.py' and 'python ml/train_supply.py' first."
        )
        
    d_pkg = joblib.load(demand_model_path)
    s_pkg = joblib.load(supply_model_path)
    
    demand_model = d_pkg["model"]
    supply_model = s_pkg["model"]
    demand_features = d_pkg.get("features", ["population_estimated", "state_tap_water_coverage_pct", "monitoring_wells_count"])
    supply_features = s_pkg.get("features", [
        "population_estimated", "gw_fall_pct", "gw_fall_gt_4m_pct", "gw_rise_pct",
        "state_tap_water_coverage_pct", "rainfall_period_actual_mm", "rainfall_period_dep_pct",
        "groundwater_stress_index"
    ])
    supply_model_type = s_pkg.get("target", s_pkg.get("model_type", "supply_ratio"))
    
    df = pd.read_csv("data/processed/jalrakshak_master.csv")
    
    # 80/20 train/test split preserving state/distribution representation
    train_df, test_df = train_test_split(df, test_size=0.20, random_state=42)
    
    X_train_d, y_train_d = train_df[demand_features], train_df["benchmark_demand_mld"]
    X_test_d, y_test_d = test_df[demand_features], test_df["benchmark_demand_mld"]
    
    X_train_s, y_train_s = train_df[supply_features], train_df["estimated_supply_mld"]
    X_test_s, y_test_s = test_df[supply_features], test_df["estimated_supply_mld"]
    
    # --- 1. EVALUATE DEMAND FORECASTING ---
    dummy_d = DummyRegressor(strategy="mean")
    dummy_d.fit(X_train_d, y_train_d)
    pred_dummy_d = dummy_d.predict(X_test_d)
    
    pred_test_d = np.round(demand_model.predict(X_test_d), 2)
    
    def calc_reg_metrics(y_true, y_pred):
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        r2 = r2_score(y_true, y_pred)
        return {"MAE_MLD": round(float(mae), 3), "RMSE_MLD": round(float(rmse), 3), "R2": round(float(r2), 4)}
        
    demand_metrics = {
        "Baseline_Mean": calc_reg_metrics(y_test_d, pred_dummy_d),
        f"Production_Demand_{d_pkg.get('best_model_name', 'Ridge')}": calc_reg_metrics(y_test_d, pred_test_d)
    }
    
    # --- 2. EVALUATE SUPPLY FORECASTING ---
    dummy_s = DummyRegressor(strategy="mean")
    dummy_s.fit(X_train_s, y_train_s)
    pred_dummy_s = dummy_s.predict(X_test_s)
    
    if supply_model_type in ["supply_ratio", "ratio"]:
        pred_test_ratio = np.clip(supply_model.predict(X_test_s), 0.10, 1.0)
        pred_test_s = np.round(pred_test_d * pred_test_ratio, 2)
    else:
        pred_test_s = np.round(supply_model.predict(X_test_s), 2)
        pred_test_ratio = np.clip(pred_test_s / pred_test_d, 0.10, 1.0)
        
    supply_metrics = {
        "Baseline_Mean": calc_reg_metrics(y_test_s, pred_dummy_s),
        f"Production_Supply_{s_pkg.get('best_model_name', 'Gradient_Boosting')}": calc_reg_metrics(y_test_s, pred_test_s)
    }
    
    # --- 3. EVALUATE SHORTAGE & RISK CLASSIFICATION ---
    test_results = test_df.copy()
    test_results["pred_demand_mld"] = pred_test_d
    test_results["pred_supply_ratio"] = np.round(pred_test_ratio, 4)
    test_results["pred_supply_mld"] = pred_test_s
    
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
    
    # Classification Metrics
    true_tiers = test_results["shortage_risk_category"].values
    pred_tiers = np.array(pred_risk_tiers)
    
    exact_accuracy = float(np.mean(true_tiers == pred_tiers))
    within_1_tier_accuracy = float(
        np.mean([abs(TIER_ORDER[t] - TIER_ORDER[p]) <= 1 for t, p in zip(true_tiers, pred_tiers)])
    )
    shortage_pct_mae = float(
        np.mean(np.abs(test_results["shortage_percentage"].values - test_results["pred_shortage_pct"].values))
    )
    
    cls_report = classification_report(
        true_tiers,
        pred_tiers,
        output_dict=True,
        zero_division=0
    )
    
    # Save city predictions table
    pred_out_cols = [
        "city", "state_ut", "benchmark_demand_mld", "pred_demand_mld",
        "estimated_supply_mld", "pred_supply_mld", "pred_supply_ratio",
        "estimated_shortage_mld", "pred_shortage_mld",
        "shortage_percentage", "pred_shortage_pct",
        "shortage_risk_category", "pred_risk_tier"
    ]
    test_preds_csv = "reports/test_predictions.csv"
    test_results[pred_out_cols].to_csv(test_preds_csv, index=False)
    
    # Cross-validation summary from training package
    cv_summary = s_pkg.get("cv_results", {}).get(s_pkg.get("best_model_name", "Gradient_Boosting"), {})
    
    full_metrics = {
        "evaluation_dataset_size": len(df),
        "held_out_test_set_size": len(test_df),
        "train_set_size": len(train_df),
        "demand_model": {
            "model_name": d_pkg.get("best_model_name", "Ridge"),
            "held_out_test_metrics": demand_metrics[f"Production_Demand_{d_pkg.get('best_model_name', 'Ridge')}"]
        },
        "supply_model": {
            "model_name": s_pkg.get("best_model_name", "Gradient_Boosting"),
            "model_type": supply_model_type,
            "held_out_test_metrics": supply_metrics[f"Production_Supply_{s_pkg.get('best_model_name', 'Gradient_Boosting')}"]
        },
        "shortage_classification_evaluation": {
            "held_out_test_exact_accuracy_pct": round(exact_accuracy * 100, 2),
            "held_out_test_within_1_tier_accuracy_pct": round(within_1_tier_accuracy * 100, 2),
            "held_out_test_shortage_percentage_mae": round(shortage_pct_mae, 2),
            "repeated_stratified_cv_metrics": cv_summary,
            "detailed_classification_report": cls_report
        }
    }
    
    with open("reports/evaluation_metrics.json", "w") as f:
        json.dump(full_metrics, f, indent=2)
        
    print("\n" + "="*80)
    print("PHASE 6 RIGOROUS EVALUATION RESULTS (PRODUCTION SAVED MODELS):")
    print("="*80)
    print("\n[Demand Forecasting on Held-Out Test Set (MLD)]:")
    print(pd.DataFrame(demand_metrics).T)
    print("\n[Supply Forecasting on Held-Out Test Set (MLD)]:")
    print(pd.DataFrame(supply_metrics).T)
    print("\n[Shortage Risk Classification & Deficit Metrics on Held-Out Test Set]:")
    print(f"  * Exact Risk Tier Accuracy   : {exact_accuracy*100:.2f}%")
    print(f"  * Within-One-Tier Accuracy   : {within_1_tier_accuracy*100:.2f}% (Tolerance for adjacent tiers)")
    print(f"  * Shortage Deficit % MAE     : {shortage_pct_mae:.2f}% (Average error on shortage percentage)")
    
    if cv_summary:
        print("\n[Repeated Stratified 5-Fold CV Across All 69 Cities]:")
        print(f"  * CV Exact Accuracy          : {cv_summary.get('exact_accuracy_pct', 'N/A')}%")
        print(f"  * CV Within-One-Tier Accuracy: {cv_summary.get('within_1_tier_accuracy_pct', 'N/A')}%")
        print(f"  * CV Shortage % MAE          : {cv_summary.get('shortage_percentage_mae', 'N/A')}%")
        
    print(f"\n[+] Detailed test predictions exported to '{test_preds_csv}'")
    print(f"[+] Full metrics JSON saved to 'reports/evaluation_metrics.json'")
    print("="*80)
    
    return full_metrics

if __name__ == "__main__":
    run_evaluation()

