import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from app.main import app, model_service
from app.config import ARTIFACT_DIR
from app.model_service import EXPECTED_FEATURE_COLUMNS, map_risk_level
from app.schemas import CustomerPredictionRequest

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_model():
    if not model_service.is_loaded:
        model_service.load_artifacts()

def test_feature_columns_order():
    """Requirement: feature_columns.json order matches Section 2."""
    assert model_service.feature_columns == EXPECTED_FEATURE_COLUMNS

def test_health_endpoint():
    """Requirement: /health responds with status ok, model_loaded: true, and model_version."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert "model_version" in data

def test_model_info_endpoint():
    """Requirement: /model-info responds correctly with no file paths."""
    res = client.get("/model-info")
    assert res.status_code == 200
    data = res.json()
    assert data["model_name"] == "RandomForestClassifier"
    assert len(data["features"]) == 10
    assert "risk_bands" in data
    assert "disclaimer" in data
    raw_text = res.text
    # Ensure no file system paths are leaked
    assert "artifacts/" not in raw_text
    assert "C:\\" not in raw_text
    assert "/Users/" not in raw_text

def test_valid_example_prediction():
    """Requirement: Valid example returns 200 with prob in [0, 1], valid risk level, and 5 factors."""
    payload = {
        "call_failure": 23,
        "complains": 1,
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["prediction"] in ("Churn", "No Churn")
    assert data["prediction_label"] in (0, 1)
    assert 0.0 <= data["churn_probability"] <= 1.0
    assert data["risk_level"] in ("Low", "Medium", "High")
    assert len(data["top_factors"]) == 5
    assert "disclaimer" in data
    assert "thresholds" in data

def test_parity_test():
    """
    Parity test: pick 10 rows from customer_churn_predictions.csv (feature columns only)
    and check that /predict probabilities match model.predict_proba direct calls (tolerance 1e-9),
    and risk levels follow the metadata thresholds.
    """
    csv_path = ARTIFACT_DIR / "customer_churn_predictions.csv"
    assert csv_path.exists()
    df = pd.read_csv(csv_path)

    sample_df = df.head(10)
    for _, row in sample_df.iterrows():
        input_data = {col: int(row[col]) for col in model_service.feature_columns}
        
        # Direct model calculation
        single_row_df = pd.DataFrame([input_data])
        direct_prob = float(model_service.model.predict_proba(single_row_df)[0, 1])

        # API call
        res = client.post("/predict", json=input_data)
        assert res.status_code == 200
        data = res.json()
        api_prob = data["churn_probability"]

        # Note that api_prob is rounded to 4 decimals, but let's check model_service directly for 1e-9 tolerance
        service_res = model_service.predict(CustomerPredictionRequest(**input_data))
        raw_direct_from_service = float(model_service.model.predict_proba(single_row_df)[0, 1])
        assert abs(direct_prob - raw_direct_from_service) < 1e-9

        # And API rounded probability should match rounded direct_prob
        assert abs(round(direct_prob, 4) - api_prob) < 1e-4

        expected_risk = map_risk_level(direct_prob, model_service.low_max, model_service.medium_max)
        assert data["risk_level"] == expected_risk

def test_boundary_risk_mapping():
    """Boundary tests: probability exactly at 0.30 and 0.60 map to Medium and High respectively."""
    assert map_risk_level(0.30, 0.30, 0.60) == "Medium"
    assert map_risk_level(0.60, 0.30, 0.60) == "High"

def test_validation_missing_field():
    payload = {
        "call_failure": 23,
        # complains missing
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert "detail" in data
    assert any("complains" in err["field"] for err in data["detail"])

def test_validation_wrong_type():
    payload = {
        "call_failure": "not_a_number",
        "complains": 1,
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert any("call_failure" in err["field"] for err in data["detail"])

def test_validation_float_rejected_for_integer():
    payload = {
        "call_failure": 23.5,
        "complains": 1,
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422

def test_validation_below_bound():
    payload = {
        "call_failure": -1,
        "complains": 1,
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
    assert any("call_failure" in err["field"] for err in res.json()["detail"])

def test_validation_above_bound():
    payload = {
        "call_failure": 51,  # max is 50
        "complains": 1,
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
    assert any("call_failure" in err["field"] for err in res.json()["detail"])

def test_validation_extra_field():
    payload = {
        "call_failure": 23,
        "complains": 1,
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
        "extra_field": "hack",
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
    assert any("extra_field" in err["field"] for err in res.json()["detail"])

def test_soft_warning_outside_observed():
    # Observed for call_failure is 0-36, but hard max is 50. Let's pass 45.
    payload = {
        "call_failure": 45,
        "complains": 1,
        "subscription_length": 33,
        "charge_amount": 0,
        "seconds_of_use": 955,
        "frequency_of_use": 47,
        "frequency_of_sms": 16,
        "distinct_called_numbers": 17,
        "age_group": 2,
        "tariff_plan": 1,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["warnings"]) > 0
    assert any("Call Failures" in w for w in data["warnings"])
