"""
JalRakshak ML Pipeline - Phase 7: Suspected Water-Loss Anomaly Detection
========================================================================
Detects anomalous municipal water-loss and non-revenue water (NRW) patterns
using an Isolation Forest combined with statistical interquartile/z-score thresholds.

DISCLAIMER:
Identifies suspected distribution losses and measurement mismatches.
Does NOT claim or confirm underground physical pipe leaks without on-ground acoustic/CCTV inspection.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

def train_water_loss_anomaly_detector():
    os.makedirs("models", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    df = pd.read_csv("data/processed/jalrakshak_master.csv")
    
    features = [
        "unaccounted_water_mld",
        "nrw_loss_percentage",
        "groundwater_stress_index",
        "state_tap_water_coverage_pct"
    ]
    
    X = df[features].copy()
    
    # Standardize features for anomaly isolation
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest (contamination ~ 10% expected anomalous patterns)
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.10,
        random_state=42
    )
    iso_forest.fit(X_scaled)
    
    # Anomaly scoring (-1 is outlier/anomaly, 1 is inlier/normal)
    raw_preds = iso_forest.predict(X_scaled)
    anomaly_scores = iso_forest.decision_function(X_scaled)
    
    df['anomaly_flag'] = np.where(raw_preds == -1, "Suspected Loss Anomaly", "Normal Distribution")
    df['anomaly_score'] = np.round(anomaly_scores, 4)
    
    # Statistical IQR check for loss percentage
    q25, q75 = df['nrw_loss_percentage'].quantile(0.25), df['nrw_loss_percentage'].quantile(0.75)
    iqr = q75 - q25
    upper_threshold = q75 + 1.5 * iqr
    
    df['statistical_loss_outlier'] = df['nrw_loss_percentage'] > upper_threshold
    
    anomalous_cities = df[df['anomaly_flag'] == "Suspected Loss Anomaly"][
        ['city', 'state_ut', 'unaccounted_water_mld', 'nrw_loss_percentage', 'groundwater_stress_index', 'anomaly_score']
    ]
    
    print("\n" + "="*70)
    print("WATER-LOSS ANOMALY DETECTION RESULTS (ISOLATION FOREST)")
    print("="*70)
    print(f"Total Cities Evaluated: {len(df)}")
    print(f"Suspected Anomalous Loss Profiles Flagged: {len(anomalous_cities)}")
    print("\nSample Anomalous Profiles Flagged:")
    print(anomalous_cities.to_string(index=False))
    
    # Save model and artifacts
    model_path = "models/anomaly_detector.joblib"
    joblib.dump({
        "scaler": scaler,
        "model": iso_forest,
        "features": features,
        "upper_iqr_loss_threshold": float(upper_threshold),
        "disclaimer": "Suspected water-loss anomaly; on-site verification required."
    }, model_path)
    
    anomaly_summary = {
        "total_evaluated_cities": len(df),
        "anomalies_detected": len(anomalous_cities),
        "upper_iqr_loss_threshold_pct": round(float(upper_threshold), 2),
        "flagged_cities": anomalous_cities.to_dict(orient="records"),
        "methodology": "Isolation Forest (contamination=0.10) + Robust IQR bounds",
        "disclaimer": "Suspected water-loss anomaly indicator, not confirmed underground pipe leak."
    }
    
    with open("reports/anomaly_detection_summary.json", "w") as f:
        json.dump(anomaly_summary, f, indent=2)
        
    print(f"\n[+] Anomaly detector saved to '{model_path}'")
    return anomaly_summary

if __name__ == "__main__":
    train_water_loss_anomaly_detector()
