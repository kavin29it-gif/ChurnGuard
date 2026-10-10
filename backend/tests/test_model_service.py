import pytest
from pathlib import Path
from app.config import ARTIFACT_DIR
from app.model_service import ModelService, map_risk_level, compute_factor_note
from app.schemas import CustomerPredictionRequest

def test_risk_level_mapping():
    low_max = 0.30
    medium_max = 0.60

    # Below low_max -> Low
    assert map_risk_level(0.0, low_max, medium_max) == "Low"
    assert map_risk_level(0.2999, low_max, medium_max) == "Low"

    # Exactly 0.30 -> Medium (boundary test)
    assert map_risk_level(0.30, low_max, medium_max) == "Medium"
    assert map_risk_level(0.45, low_max, medium_max) == "Medium"
    assert map_risk_level(0.5999, low_max, medium_max) == "Medium"

    # Exactly 0.60 -> High (boundary test)
    assert map_risk_level(0.60, low_max, medium_max) == "High"
    assert map_risk_level(0.85, low_max, medium_max) == "High"
    assert map_risk_level(1.0, low_max, medium_max) == "High"

def test_factor_note_binary():
    assert "Similar" in compute_factor_note("complains", 0, 0)
    assert "Similar" in compute_factor_note("complains", 1, 1)
    assert "Higher" in compute_factor_note("complains", 1, 0)
    assert "Lower" in compute_factor_note("complains", 0, 1)

def test_factor_note_numeric():
    # 100 with median 100 -> within 10% -> Similar
    assert "Similar" in compute_factor_note("seconds_of_use", 100, 100)
    # 105 with median 100 -> within 10% -> Similar
    assert "Similar" in compute_factor_note("seconds_of_use", 105, 100)
    # 95 with median 100 -> within 10% -> Similar
    assert "Similar" in compute_factor_note("seconds_of_use", 95, 100)
    # 120 with median 100 -> > 10% -> Higher
    assert "Higher" in compute_factor_note("seconds_of_use", 120, 100)
    # 80 with median 100 -> < -10% -> Lower
    assert "Lower" in compute_factor_note("seconds_of_use", 80, 100)

def test_model_service_prediction():
    service = ModelService(ARTIFACT_DIR)
    service.load_artifacts()
    assert service.is_loaded

    req = CustomerPredictionRequest(
        call_failure=23,
        complains=1,
        subscription_length=33,
        charge_amount=0,
        seconds_of_use=955,
        frequency_of_use=47,
        frequency_of_sms=16,
        distinct_called_numbers=17,
        age_group=2,
        tariff_plan=1,
    )

    res = service.predict(req)
    assert res.prediction in ("Churn", "No Churn")
    assert res.prediction_label in (0, 1)
    assert 0.0 <= res.churn_probability <= 1.0
    assert res.risk_level in ("Low", "Medium", "High")
    assert len(res.top_factors) == 5
    assert res.disclaimer == "This is a statistical estimate, not a guarantee of customer behaviour."
    assert res.thresholds.class_threshold == 0.5
    assert res.thresholds.low_max == 0.3
    assert res.thresholds.medium_max == 0.6
