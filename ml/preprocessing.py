"""
JalRakshak ML Pipeline - Phase 2: Data Engineering & Master Dataset Generator
=============================================================================
Reproducible pipeline that:
1. Loads raw CGWB city groundwater data (66 urban centers).
2. Standardizes city and state names for precise alignment.
3. Joins IMD District rainfall observations (daily & cumulative departure).
4. Merges JJM state tap water connectivity infrastructure coverage.
5. Joins Census demographic distributions.
6. Computes CPHEEO (Central Public Health & Environmental Engineering Organisation) 
   and AMRUT urban water benchmarks:
   - Domestic design demand (135 Liters Per Capita per Day - LPCD)
   - Baseline municipal demand proxy (MLD)
   - Estimated available supply proxy (MLD) based on groundwater stress & tap connectivity
   - Groundwater Stress Vulnerability Index (GSVI)
7. Outputs cleaned master dataset to `data/processed/jalrakshak_master.csv`.
"""

import os
import pandas as pd
import numpy as np

# City population estimates for major urban municipal corporations (in Lakhs / Millions based on Census & Urban Local Body projections)
CITY_POPULATION_ESTIMATES = {
    "Delhi": 16787941,
    "Mumbai City": 3145966,
    "Mumbai Suburban": 9356326,
    "Bangalore": 8443675,
    "Hyderabad": 6809970,
    "Ahmedabad (phreatic)": 5577940,
    "Ahmedabad (Confined)": 5577940,
    "Chennai": 4646732,
    "Kolkata (Confined)": 4496694,
    "Surat": 4467797,
    "Pune": 3124458,
    "Jaipur": 3046163,
    "Lucknow": 2817105,
    "Kanpur": 2765348,
    "Nagpur": 2405665,
    "Indore": 1964086,
    "Thane": 1841488,
    "Bhopal": 1798218,
    "Vishakapatnam": 1728128,
    "Patna (phreatic)": 1684222,
    "Patna (Deeper)": 1684222,
    "Vadodara (phreatic)": 1670806,
    "Vadodara (Confined)": 1670806,
    "Ghaziabad": 1648643,
    "Ludhiana": 1618879,
    "Agra": 1585704,
    "Nashik": 1486053,
    "Faridabad": 1414050,
    "Meerut": 1305429,
    "Rajkot": 1286678,
    "Varanasi": 1201815,
    "Allahabad": 1112544,
    "Amritsar": 1132383,
    "Jabalpur": 1055525,
    "Raipur": 1010087,
    "Jodhpur": 1033756,
    "Kota": 1001694,
    "Guwahati": 957352,
    "Chandigarh": 961587,
    "Gwalior": 1069276,
    "Vijayawada": 1034358,
    "Madurai": 1017065,
    "Bhubaneshwar": 843402,
    "Coimbatore": 1050721,
    "Bhilai": 625700,
    "Ranchi": 1073427,
    "Dhanbad": 1162472,
    "Jamshedpur": 677350,
    "Kochi": 602046,
    "Kozhikode": 431560,
    "Thiruvananthapuram": 743691,
    "Thrissur": 315596,
    "Kannur": 232486,
    "Kollam": 348657,
    "Malappuram": 101386,
    "Aurangabad": 1175116,
    "Vasai Virar": 1222390,
    "Dehradun": 574840,
    "Ajmer": 542321,
    "Bikaner": 644406,
    "Jaisalmer": 65471,
    "Ambala": 207934,
    "Gurugram": 876969,
    "Yamunanagar": 216677,
    "Jalandhar": 862886,
    "SAS nagar": 146213,
    "Patiala": 406192,
    "Trichy": 847387,
    "Vellore": 185803,
    "Gandhinagar": 292797
}

# Mapping city names in CGWB to matching district in IMD rainfall dataset
CITY_TO_IMD_DISTRICT_MAP = {
    "Vijayawada": "NTR DISTRICT",
    "Vishakapatnam": "VISHAKHAPATNAM",
    "Guwahati": "Guwahati (Kamrup Metro)",
    "Patna (phreatic)": "Patna",
    "Patna (Deeper)": "Patna",
    "Bhilai": "Durg (Bhilai)",
    "Raipur": "Raipur",
    "Delhi": "Central Delhi",
    "Ahmedabad (phreatic)": "Ahmedabad",
    "Ahmedabad (Confined)": "Ahmedabad",
    "Rajkot": "Rajkot",
    "Surat": "Surat",
    "Vadodara (phreatic)": "Vadodara",
    "Vadodara (Confined)": "Vadodara",
    "Gandhinagar": "Gandhinagar",
    "Ambala": "Ambala",
    "Faridabad": "Faridabad",
    "Gurugram": "Gurgaon",
    "Yamunanagar": "Yamunanagar",
    "Chandigarh": "Chandigarh",
    "Ranchi": "Ranchi",
    "Dhanbad": "Dhanbad",
    "Jamshedpur": "East Singhbhum (Jamshedpur)",
    "Bangalore": "Bengaluru Urban",
    "Kannur": "Kannur",
    "Kochi": "Ernakulam (Kochi)",
    "Kollam": "Kollam",
    "Kozhikode": "Kozhikode",
    "Malappuram": "Malappuram",
    "Thiruvananthapuram": "Thiruvananthapuram",
    "Thrissur": "Thrissur",
    "Bhopal": "Bhopal",
    "Gwalior": "Gwalior",
    "Indore": "Indore",
    "Jabalpur": "Jabalpur",
    "Aurangabad": "Chhatrapati Sambhajinagar (Aurangabad)",
    "Mumbai City": "Mumbai City",
    "Mumbai Suburban": "Mumbai Suburban",
    "Nagpur": "Nagpur",
    "Nashik": "Nashik",
    "Pune": "Pune",
    "Vasai Virar": "Thane (Vasai Virar)",
    "Bhubaneshwar": "Bhubaneshwar (Khurda)",
    "Amritsar": "Amritsar",
    "Jalandhar": "Jalandhar",
    "Ludhiana": "Ludhiana",
    "SAS nagar": "SAS Nagar",
    "Patiala": "Patiala",
    "Ajmer": "Ajmer",
    "Bikaner": "Bikaner",
    "Jaipur": "Jaipur",
    "Jaisalmer": "Jaisalmer",
    "Jodhpur": "Jodhpur",
    "Kota": "Kota",
    "Chennai": "Chennai",
    "Coimbatore": "Coimbatore",
    "Madurai": "Madurai",
    "Trichy": "Tiruchirappalli (Trichy)",
    "Vellore": "Vellore",
    "Hyderabad": "Hyderabad",
    "Agra": "Agra",
    "Allahabad": "Prayagraj (Allahabad)",
    "Ghaziabad": "Ghaziabad",
    "Kanpur": "Kanpur City",
    "Lucknow": "Lucknow",
    "Meerut": "Meerut",
    "Varanasi": "Varanasi",
    "Dehradun": "Dehradun",
    "Kolkata (Confined)": "Kolkata"
}

def clean_and_build_master_dataset():
    """Builds the comprehensive, cleaned master dataset."""
    os.makedirs("data/processed", exist_ok=True)
    
    # Load raw datasets
    df_cgwb = pd.read_csv("data/raw/cgwb_groundwater_decadal_cities.csv")
    df_jjm = pd.read_csv("data/raw/jjm_tap_water_state_status.csv")
    df_imd = pd.read_csv("data/raw/imd_district_rainfall_oct2026.csv")
    df_pop = pd.read_csv("data/raw/census_2011_state_population.csv")
    
    # 1. Clean state names for consistent merging
    df_cgwb['state_ut_clean'] = df_cgwb['state_ut'].str.strip()
    df_jjm['state_ut_clean'] = df_jjm['state_ut'].str.strip()
    df_pop['state_ut_clean'] = df_pop['state_ut'].str.strip()
    
    # 2. Merge State Demographics & Tap Water Access
    df_state_meta = pd.merge(df_jjm, df_pop, on='state_ut_clean', how='outer', suffixes=('_jjm', '_pop'))
    
    # 3. Process City Records
    master_rows = []
    
    for _, city_row in df_cgwb.iterrows():
        city_name = city_row['city'].strip()
        state_name = city_row['state_ut'].strip()
        
        # City population lookup
        city_pop = CITY_POPULATION_ESTIMATES.get(city_name, 500000)
        
        # Map to IMD rainfall
        imd_dist = CITY_TO_IMD_DISTRICT_MAP.get(city_name, city_name)
        imd_match = df_imd[df_imd['district'].str.lower() == imd_dist.lower()]
        
        if len(imd_match) == 0:
            # Fallback by substring
            imd_match = df_imd[df_imd['district'].str.lower().str.contains(city_name.split()[0].lower())]
            
        if len(imd_match) > 0:
            day_rain_mm = float(imd_match.iloc[0]['day_actual_mm'])
            day_normal_mm = float(imd_match.iloc[0]['day_normal_mm'])
            day_dep_pct = float(imd_match.iloc[0]['day_dep_pct'])
            period_rain_mm = float(imd_match.iloc[0]['period_actual_mm'])
            period_dep_pct = float(imd_match.iloc[0]['period_dep_pct'])
            rainfall_cat = str(imd_match.iloc[0]['period_cat'])
        else:
            day_rain_mm = 0.0
            day_normal_mm = 2.0
            day_dep_pct = -100.0
            period_rain_mm = 10.0
            period_dep_pct = -50.0
            rainfall_cat = "D"
            
        # State JJM tap coverage lookup
        state_jjm = df_jjm[df_jjm['state_ut'].str.lower() == state_name.lower()]
        tap_pct = float(state_jjm.iloc[0]['tap_water_supply_percentage']) if len(state_jjm) > 0 else 75.0
        
        # Groundwater metrics
        total_fall_pct = float(city_row['total_fall_pct'])
        total_rise_pct = float(city_row['total_rise_pct'])
        fall_gt_4m_pct = float(city_row['fall_gt_4m_pct'])
        wells_count = int(city_row['wells_analysed'])
        
        # Standard CPHEEO Urban Water Benchmark: 135 Liters Per Capita per Day (LPCD)
        # 1 MLD = 1,000,000 Liters / day
        # Domestic Demand (MLD) = (Population * 135) / 1,000,000
        # Total Urban Demand (including 15% non-domestic & institutional) = Domestic Demand * 1.15
        base_demand_mld = round((city_pop * 135 * 1.15) / 1e6, 2)
        
        # Groundwater Vulnerability Index (GSVI) (Scale 0 - 100):
        # Higher score = more vulnerable / severe depletion
        gsvi_score = round(0.55 * total_fall_pct + 0.35 * fall_gt_4m_pct + 0.10 * max(0, -period_dep_pct), 2)
        gsvi_score = min(100.0, max(0.0, gsvi_score))
        
        # Physical Supply Delivery Proxy (MLD):
        # Supply delivery capacity reflects municipal infrastructure factor & groundwater availability factor
        gw_availability_factor = max(0.40, (1.0 - (gsvi_score / 150.0)))
        tap_connectivity_factor = (tap_pct / 100.0) * 0.35 + 0.65
        estimated_supply_mld = round(base_demand_mld * gw_availability_factor * tap_connectivity_factor, 2)
        
        # Shortage calculation
        shortage_mld = max(0.0, round(base_demand_mld - estimated_supply_mld, 2))
        shortage_pct = round((shortage_mld / base_demand_mld) * 100.0, 2) if base_demand_mld > 0 else 0.0
        
        # Risk Category classification:
        # Low (<10%), Medium (10-25%), High (25-40%), Critical (>=40%)
        if shortage_pct >= 40.0:
            risk_category = "Critical"
        elif shortage_pct >= 25.0:
            risk_category = "High"
        elif shortage_pct >= 10.0:
            risk_category = "Medium"
        else:
            risk_category = "Low"
            
        # Water Loss / Non-Revenue Water (NRW) Indicator proxy (Standard Indian Urban range 15% - 40%)
        # Losses correlate with aging infrastructure (low tap % states) and pressure anomalies
        nrw_loss_pct = round(15.0 + (100.0 - tap_pct) * 0.20 + (gsvi_score * 0.05), 2)
        unaccounted_water_mld = round(estimated_supply_mld * (nrw_loss_pct / 100.0), 2)
        
        master_rows.append({
            "city": city_name,
            "state_ut": state_name,
            "population_estimated": city_pop,
            "monitoring_wells_count": wells_count,
            "gw_fall_pct": total_fall_pct,
            "gw_rise_pct": total_rise_pct,
            "gw_fall_gt_4m_pct": fall_gt_4m_pct,
            "state_tap_water_coverage_pct": tap_pct,
            "rainfall_day_actual_mm": day_rain_mm,
            "rainfall_day_normal_mm": day_normal_mm,
            "rainfall_day_dep_pct": day_dep_pct,
            "rainfall_period_actual_mm": period_rain_mm,
            "rainfall_period_dep_pct": period_dep_pct,
            "rainfall_category": rainfall_cat,
            "groundwater_stress_index": gsvi_score,
            "benchmark_demand_mld": base_demand_mld,
            "estimated_supply_mld": estimated_supply_mld,
            "estimated_shortage_mld": shortage_mld,
            "shortage_percentage": shortage_pct,
            "shortage_risk_category": risk_category,
            "nrw_loss_percentage": nrw_loss_pct,
            "unaccounted_water_mld": unaccounted_water_mld
        })
        
    df_master = pd.DataFrame(master_rows)
    master_path = "data/processed/jalrakshak_master.csv"
    df_master.to_csv(master_path, index=False)
    print(f"[+] Successfully generated cleaned master dataset at '{master_path}' with {len(df_master)} city records.")
    return df_master

if __name__ == "__main__":
    clean_and_build_master_dataset()
