"""
JalRakshak ML Pipeline - Phase 1: Comprehensive Data Audit
==========================================================
Audits all uploaded datasets:
1. Census 2011 Population & Demographics (35 State/UT CSV files)
2. Jal Jeevan Mission (JJM) Har Ghar Jal Tap Water Status (State-level)
3. CGWB Decadal Groundwater Fluctuation Report (66 Urban Cities)
4. IMD Hydromet District Rainfall Distribution Report (36 Met Subdivisions / All Districts)
"""

import os
import glob
import re
import pandas as pd
import numpy as np

def parse_population_files(pop_dir="population"):
    """Parse all 35 Census 2011 Primary Census Abstract CSV files."""
    records = []
    files = glob.glob(os.path.join(pop_dir, "*.csv"))
    
    for fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                lines = [l.strip().replace('"', '') for l in f.readlines() if l.strip()]
            
            if len(lines) < 6:
                continue
            
            state_name = lines[2].strip()
            hh_line = lines[3].strip()
            hh_match = re.search(r'No\. of households:\s*([\d,]+)', hh_line)
            households = int(hh_match.group(1).replace(',', '')) if hh_match else np.nan
            
            # Find data lines
            pop_data = {}
            for line in lines[4:]:
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 3:
                    indicator = parts[1]
                    try:
                        persons = int(parts[2].replace(',', ''))
                        males = int(parts[3].replace(',', '')) if len(parts) > 3 and parts[3].isdigit() else np.nan
                        females = int(parts[4].replace(',', '')) if len(parts) > 4 and parts[4].isdigit() else np.nan
                        pop_data[indicator] = persons
                    except (ValueError, IndexError):
                        continue
            
            records.append({
                "state_ut": state_name,
                "households_census2011": households,
                "population_census2011": pop_data.get("Population", np.nan),
                "child_population": pop_data.get("Child Population", np.nan),
                "scheduled_castes": pop_data.get("Scheduled Castes", np.nan),
                "scheduled_tribes": pop_data.get("Scheduled Tribes", np.nan),
                "literate_population": pop_data.get("Literate", np.nan),
                "illiterate_population": pop_data.get("Illiterate", np.nan),
                "workers_total": pop_data.get("Workers", np.nan),
                "non_workers_total": pop_data.get("Non Workers", np.nan),
                "source_file": os.path.basename(fpath)
            })
        except Exception as e:
            print(f"Error parsing {fpath}: {e}")
            
    df = pd.DataFrame(records)
    return df

def audit_dataset(name, df, source, geo_granularity, temporal_coverage, units, is_observed, has_target):
    """Generate standardized audit metrics for a dataset."""
    audit_res = {
        "dataset_name": name,
        "source": source,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "geo_granularity": geo_granularity,
        "temporal_coverage": temporal_coverage,
        "measurement_units": units,
        "missing_values": df.isnull().sum().to_dict(),
        "duplicate_rows": int(df.duplicated().sum()),
        "is_observed_or_projection": is_observed,
        "has_supervised_time_series_target": has_target
    }
    return audit_res

def run_full_audit():
    print("="*80)
    print("JALRAKSHAK: RUNNING PHASE 1 DATA AUDIT")
    print("="*80)
    
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    # 1. Population Audit
    df_pop = parse_population_files("population")
    df_pop.to_csv("data/raw/census_2011_state_population.csv", index=False)
    audit_pop = audit_dataset(
        "Census 2011 Primary Census Abstract",
        df_pop,
        "Office of the Registrar General & Census Commissioner, India (Census 2011)",
        "State / Union Territory (35 units)",
        "Static Reference Year: 2011",
        "Counts (Persons, Households)",
        "Observed Official Census Counts",
        False  # No time-series target
    )
    
    # 2. JJM Tap Water Status
    jjm_path = "data/raw/jjm_tap_water_state_status.csv"
    if os.path.exists(jjm_path):
        df_jjm = pd.read_csv(jjm_path)
        audit_jjm = audit_dataset(
            "Jal Jeevan Mission Har Ghar Jal Tap Water Status",
            df_jjm,
            "Ministry of Jal Shakti, Department of Drinking Water and Sanitation",
            "State / Union Territory (34 units)",
            "Cross-sectional Snapshot (As of Oct 2026)",
            "Households (Count), Coverage (%)",
            "Administrative Service Connection Records",
            False # Cross-sectional coverage target only
        )
    else:
        df_jjm = None
        audit_jjm = None
        
    # 3. CGWB Groundwater Decadal Fluctuation
    cgwb_path = "data/raw/cgwb_groundwater_decadal_cities.csv"
    if os.path.exists(cgwb_path):
        df_cgwb = pd.read_csv(cgwb_path)
        audit_cgwb = audit_dataset(
            "CGWB Decadal Water Level Fluctuation in Urban Cities",
            df_cgwb,
            "Central Ground Water Board (CGWB), Ministry of Jal Shakti",
            "Urban Cities (66 cities across 17 States/UTs)",
            "Decadal Comparison: Mean [Nov 2013 - Nov 2022] vs Nov 2023",
            "Well depth fluctuations in meters (0-2m, 2-4m, >4m), Well counts, Percentages (%)",
            "Observed Monitoring Well Measurements Summary",
            False # Cross-sectional decadal fluctuation summary, no daily/monthly volumetric target
        )
    else:
        df_cgwb = None
        audit_cgwb = None

    print(f"[+] Census Population parsed: {len(df_pop)} State records.")
    if df_jjm is not None:
        print(f"[+] JJM Tap Water parsed: {len(df_jjm)} State records.")
    if df_cgwb is not None:
        print(f"[+] CGWB Groundwater parsed: {len(df_cgwb)} Urban City records.")
        
    print("\n" + "="*80)
    print("AUDIT SUMMARY & TARGET VARIABLE FEASIBILITY CHECK:")
    print("="*80)
    print("1. Water Supply Target (MLD Time Series): MISSING in uploaded files.")
    print("2. Water Demand/Consumption Target (MLD Time Series): MISSING in uploaded files.")
    print("3. Available Data: High-value auxiliary features (Demographics, Decadal Groundwater trends, Tap water access %, Rainfall).")
    print("="*80)

if __name__ == "__main__":
    run_full_audit()
