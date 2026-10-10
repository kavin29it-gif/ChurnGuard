from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, StrictInt, ConfigDict

FEATURE_LABELS: Dict[str, str] = {
    "call_failure": "Call Failures",
    "complains": "Has Complained",
    "subscription_length": "Subscription Length (months)",
    "charge_amount": "Charge Amount Level",
    "seconds_of_use": "Total Seconds of Use",
    "frequency_of_use": "Frequency of Use (calls)",
    "frequency_of_sms": "Frequency of SMS",
    "distinct_called_numbers": "Distinct Numbers Called",
    "age_group": "Age Group",
    "tariff_plan": "Tariff Plan",
}

class CustomerPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    call_failure: StrictInt = Field(..., ge=0, le=50, description="Call Failures (0-50)")
    complains: StrictInt = Field(..., ge=0, le=1, description="Has Complained (0 or 1)")
    subscription_length: StrictInt = Field(..., ge=1, le=60, description="Subscription Length in months (1-60)")
    charge_amount: StrictInt = Field(..., ge=0, le=10, description="Charge Amount Level (0-10)")
    seconds_of_use: StrictInt = Field(..., ge=0, le=20000, description="Total Seconds of Use (0-20000)")
    frequency_of_use: StrictInt = Field(..., ge=0, le=300, description="Frequency of Use (0-300)")
    frequency_of_sms: StrictInt = Field(..., ge=0, le=600, description="Frequency of SMS (0-600)")
    distinct_called_numbers: StrictInt = Field(..., ge=0, le=120, description="Distinct Numbers Called (0-120)")
    age_group: StrictInt = Field(..., ge=1, le=5, description="Age Group (1-5)")
    tariff_plan: StrictInt = Field(..., ge=1, le=2, description="Tariff Plan (1 or 2)")

class FactorItem(BaseModel):
    feature: str
    label: str
    global_importance: float
    your_value: int
    typical_churned: float
    typical_retained: float
    note: str

class ThresholdsInfo(BaseModel):
    class_threshold: float
    low_max: float
    medium_max: float

class PredictionResponse(BaseModel):
    prediction: str
    prediction_label: int
    churn_probability: float
    risk_level: str
    thresholds: ThresholdsInfo
    top_factors: List[FactorItem]
    warnings: List[str]
    disclaimer: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str] = None

class FeatureInfo(BaseModel):
    name: str
    label: str
    observed_range: List[float]
    hard_range: List[int]

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    features: List[FeatureInfo]
    risk_bands: Dict[str, float]
    class_threshold: float
    top_global_features: List[str]
    disclaimer: str
