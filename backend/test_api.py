"""
Regression and Integration Test Suite for JalRakshak Backend API & Inference Pipeline
"""
import unittest
from backend.main import (
    health_check,
    list_cities,
    predict,
    what_if_simulator,
    find_city_in_df,
    get_master_df,
    PredictionRequest,
    SimulatorRequest,
)
from ml.shortage_engine import compute_shortage

class TestJalRakshakBackend(unittest.TestCase):
    def test_health(self):
        res = health_check()
        self.assertEqual(res["status"], "healthy")

    def test_cities_completeness(self):
        res = list_cities()
        self.assertGreater(res["total_cities"], 0)
        c0 = res["cities"][0]
        self.assertIn("unaccounted_water_mld", c0)
        self.assertIn("monitoring_wells_count", c0)
        self.assertIn("gw_fall_pct", c0)
        self.assertIn("gw_fall_gt_4m_pct", c0)
        self.assertIn("state_tap_water_coverage_pct", c0)

    def test_find_city_parentheses_and_aliases(self):
        df = get_master_df()
        self.assertIsNotNone(find_city_in_df(df, "Patna"))
        self.assertIsNotNone(find_city_in_df(df, "Bengaluru"))
        self.assertIsNotNone(find_city_in_df(df, "Bangalore"))
        self.assertIsNotNone(find_city_in_df(df, "Ahmedabad"))

    def test_predict_bengaluru(self):
        res = predict(PredictionRequest(city="Bengaluru"))
        self.assertEqual(res["population"], 8443675)
        self.assertIn("water_balance", res)
        self.assertGreater(res["water_balance"]["predicted_demand_mld"], 0)
        self.assertGreater(res["water_balance"]["predicted_supply_mld"], 0)

    def test_simulator_patna(self):
        res = what_if_simulator(
            SimulatorRequest(city="Patna", current_nrw_loss_pct=25.0, target_nrw_loss_pct=15.0)
        )
        self.assertGreater(res["baseline"]["demand_mld"], 0)
        self.assertGreater(res["simulation_results"]["water_saved_mld"], 0)

    def test_shortage_physics(self):
        res = compute_shortage(100.0, 60.0)
        self.assertEqual(res["shortage_amount_mld"], 40.0)
        self.assertEqual(res["shortage_percentage"], 40.0)
        self.assertEqual(res["risk_tier"], "Critical")

if __name__ == "__main__":
    unittest.main()
