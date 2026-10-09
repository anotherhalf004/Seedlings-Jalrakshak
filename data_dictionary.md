# JalRakshak — Data Dictionary & Source Specification

This document provides a comprehensive data dictionary for all raw and processed datasets integrated into the **JalRakshak** Smart Water Crisis & Leakage Prevention project.

---

## 1. Census 2011 Primary Census Abstract (`data/raw/census_2011_state_population.csv`)
* **Source:** Office of the Registrar General & Census Commissioner, India (Ministry of Home Affairs).
* **Granularity:** State / Union Territory level (35 records).
* **Temporal Coverage:** Static snapshot (Census 2011 official counts).
* **Type:** Official observed administrative enumeration.

| Column Name | Data Type | Measurement Unit | Description | Transformation / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `state_ut` | string | Categorical name | Name of Indian State or Union Territory | Standardized casing & string trimmed |
| `households_census2011` | integer | Count of households | Total enumerated households in 2011 | Parsed from header metadata |
| `population_census2011` | integer | Persons (Count) | Total enumerated population in 2011 | Sum of male + female persons |
| `child_population` | integer | Persons (Count) | Child population aged 0–6 years | Direct census indicator |
| `scheduled_castes` | integer | Persons (Count) | Population belonging to Scheduled Castes | Direct census indicator |
| `scheduled_tribes` | integer | Persons (Count) | Population belonging to Scheduled Tribes | Direct census indicator |
| `literate_population` | integer | Persons (Count) | Number of literate persons | Direct census indicator |
| `illiterate_population` | integer | Persons (Count) | Number of illiterate persons | Direct census indicator |
| `workers_total` | integer | Persons (Count) | Total working population | Direct census indicator |
| `non_workers_total` | integer | Persons (Count) | Total non-working population | Direct census indicator |

---

## 2. Jal Jeevan Mission Har Ghar Jal Tap Water Status (`data/raw/jjm_tap_water_state_status.csv`)
* **Source:** Ministry of Jal Shakti, Department of Drinking Water & Sanitation (Government of India).
* **Granularity:** State / Union Territory level (34 records).
* **Temporal Coverage:** Cross-sectional snapshot (October 2026).
* **Type:** Administrative service connection records.

| Column Name | Data Type | Measurement Unit | Description | Transformation / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `state_ut` | string | Categorical name | Name of Indian State / Union Territory | Aligned with Census state names |
| `total_households` | integer | Count | Total rural households targeted for tap water | Raw government count |
| `households_with_tap_water_supply` | integer | Count | Functional household tap connections provided | Verified connection count |
| `tap_water_supply_percentage` | float | Percentage (%) | Percentage of households with tap water connection | `(households_with_tap / total_households) * 100` |

---

## 3. CGWB Decadal Groundwater Fluctuation (`data/raw/cgwb_groundwater_decadal_cities.csv`)
* **Source:** Central Ground Water Board (CGWB), Ministry of Jal Shakti.
* **Granularity:** Urban City level (66 major urban monitoring clusters).
* **Temporal Coverage:** Decadal Comparison: Mean of November (2013 to 2022) vs November 2023.
* **Type:** Observed hydrogeological well monitoring summary.

| Column Name | Data Type | Measurement Unit | Description | Transformation / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `state_ut` | string | Categorical name | State/UT containing the urban city | Standardized naming |
| `city` | string | Categorical name | Urban city / aquifer zone name | Standardized name (e.g. Bangalore, Delhi) |
| `wells_analysed` | integer | Count | Total monitoring wells measured | Integer count |
| `rise_0_2m_no` | integer | Count | Monitoring wells showing water level rise of 0–2 m | Observed count |
| `rise_0_2m_pct` | float | Percentage (%) | Percentage of analysed wells with 0–2 m rise | Computed percentage |
| `rise_2_4m_no` | integer | Count | Monitoring wells showing water level rise of 2–4 m | Observed count |
| `rise_2_4m_pct` | float | Percentage (%) | Percentage of analysed wells with 2–4 m rise | Computed percentage |
| `rise_gt_4m_no` | integer | Count | Monitoring wells showing water level rise > 4 m | Observed count |
| `rise_gt_4m_pct` | float | Percentage (%) | Percentage of analysed wells with > 4 m rise | Computed percentage |
| `total_rise_no` | integer | Count | Total wells with rising water levels | Sum of rise categories |
| `total_rise_pct` | float | Percentage (%) | Percentage of total wells with rising water table | Direct CGWB metric |
| `fall_0_2m_no` | integer | Count | Monitoring wells showing water level drop of 0–2 m | Observed count |
| `fall_0_2m_pct` | float | Percentage (%) | Percentage of analysed wells with 0–2 m drop | Computed percentage |
| `fall_2_4m_no` | integer | Count | Monitoring wells showing water level drop of 2–4 m | Observed count |
| `fall_2_4m_pct` | float | Percentage (%) | Percentage of analysed wells with 2–4 m drop | Computed percentage |
| `fall_gt_4m_no` | integer | Count | Monitoring wells showing water level drop > 4 m | Observed count |
| `fall_gt_4m_pct` | float | Percentage (%) | Percentage of analysed wells with > 4 m drop | Computed percentage |
| `total_fall_no` | integer | Count | Total wells with falling water levels | Sum of fall categories |
| `total_fall_pct` | float | Percentage (%) | Percentage of total wells with falling water table | Direct CGWB metric |

---

## 4. IMD Hydromet District Rainfall Distribution (`data/raw/imd_district_rainfall_oct2026.csv`)
* **Source:** India Meteorological Department (IMD), Hydromet Division, New Delhi.
* **Granularity:** District / Meteorological Subdivision level.
* **Temporal Coverage:** Daily snapshot (08-10-2026) & Cumulative Window (01-10-2026 to 08-10-2026).
* **Type:** Observed meteorological precipitation measurements and climatological normals.

| Column Name | Data Type | Measurement Unit | Description | Transformation / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `state_ut` | string | Categorical name | State / UT name | Standardized name |
| `district` | string | Categorical name | Administrative district / city district | Standardized district mapping |
| `day_actual_mm` | float | Millimeters (mm) | Actual recorded rainfall on 08-10-2026 | Observed IMD gauge reading |
| `day_normal_mm` | float | Millimeters (mm) | Long-period normal rainfall for the day | Climatological baseline |
| `day_dep_pct` | float | Percentage (%) | Departure from daily normal | `((Actual - Normal) / Normal) * 100` |
| `day_cat` | string | Category code | IMD Rainfall Category (LE, E, N, D, LD, NR, ND) | Standard IMD classification |
| `period_actual_mm` | float | Millimeters (mm) | Cumulative actual rainfall (01-10 to 08-10) | Sum of daily precipitation |
| `period_normal_mm` | float | Millimeters (mm) | Cumulative normal rainfall (01-10 to 08-10) | Period normal baseline |
| `period_dep_pct` | float | Percentage (%) | Cumulative departure percentage | `((Period Actual - Period Normal) / Period Normal) * 100` |
| `period_cat` | string | Category code | IMD Cumulative Category code | Standard IMD classification |
