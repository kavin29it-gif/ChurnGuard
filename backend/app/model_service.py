from pathlib import Path
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
import joblib

from app.schemas import (
    CustomerPredictionRequest,
    PredictionResponse,
    FactorItem,
    ThresholdsInfo,
    FEATURE_LABELS,
)
from app.reference import load_reference_stats, get_reference_stats

logger = logging.getLogger(__name__)

EXPECTED_FEATURE_COLUMNS = [
    "call_failure",
    "complains",
    "subscription_length",
    "charge_amount",
    "seconds_of_use",
    "frequency_of_use",
    "frequency_of_sms",
    "distinct_called_numbers",
    "age_group",
    "tariff_plan",
]

HARD_RANGES = {
    "call_failure": [0, 50],
    "complains": [0, 1],
    "subscription_length": [1, 60],
    "charge_amount": [0, 10],
    "seconds_of_use": [0, 20000],
    "frequency_of_use": [0, 300],
    "frequency_of_sms": [0, 600],
    "distinct_called_numbers": [0, 120],
    "age_group": [1, 5],
    "tariff_plan": [1, 2],
}

DEFAULT_DISCLAIMER = "This is a statistical estimate, not a guarantee of customer behaviour."

def map_risk_level(probability: float, low_max: float, medium_max: float) -> str:
    """
    Maps probability to risk level:
    - Low if p < low_max
    - Medium if low_max <= p < medium_max
    - High if p >= medium_max
    Exactly 0.30 -> Medium, exactly 0.60 -> High.
    """
    if probability < low_max:
        return "Low"
    elif probability < medium_max:
        return "Medium"
    else:
        return "High"

def compute_factor_note(feature: str, your_value: float, typical_retained: float) -> str:
    """
    Computes comparative note:
    Define 'similar' as within ±10% of the retained median or equal for binary fields.
    """
    is_binary = feature in ("complains",)
    if is_binary:
        if your_value == typical_retained:
            return "Similar compared with typical retained customers"
        elif your_value > typical_retained:
            return "Higher compared with typical retained customers"
        else:
            return "Lower compared with typical retained customers"

    if typical_retained == 0:
        if your_value == 0:
            return "Similar compared with typical retained customers"
        elif your_value > 0:
            return "Higher compared with typical retained customers"
        else:
            return "Lower compared with typical retained customers"

    diff_ratio = abs(your_value - typical_retained) / abs(typical_retained)
    if diff_ratio <= 0.10:
        return "Similar compared with typical retained customers"
    elif your_value > typical_retained:
        return "Higher compared with typical retained customers"
    else:
        return "Lower compared with typical retained customers"

class ModelService:
    def __init__(self, artifact_dir: Path):
        self.artifact_dir = artifact_dir
        self.model = None
        self.feature_columns: List[str] = []
        self.metadata: Dict[str, Any] = {}
        self.feature_importance_df: Optional[pd.DataFrame] = None
        self.top_5_features: List[Tuple[str, float]] = []
        self.reference_stats: Dict[str, Dict[str, float]] = {}
        self.is_loaded = False

    def load_artifacts(self):
        try:
            model_path = self.artifact_dir / "random_forest_churn_model.pkl"
            if not model_path.exists():
                raise FileNotFoundError(f"Model file missing: {model_path}")
            self.model = joblib.load(model_path)

            cols_path = self.artifact_dir / "feature_columns.json"
            if not cols_path.exists():
                raise FileNotFoundError(f"Feature columns file missing: {cols_path}")
            with open(cols_path, "r", encoding="utf-8") as f:
                self.feature_columns = json.load(f)

            if self.feature_columns != EXPECTED_FEATURE_COLUMNS:
                raise ValueError(
                    f"Feature columns mismatch! Expected: {EXPECTED_FEATURE_COLUMNS}, got: {self.feature_columns}"
                )

            meta_path = self.artifact_dir / "model_metadata.json"
            if not meta_path.exists():
                raise FileNotFoundError(f"Metadata file missing: {meta_path}")
            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

            imp_path = self.artifact_dir / "feature_importance.csv"
            if not imp_path.exists():
                raise FileNotFoundError(f"Feature importance file missing: {imp_path}")
            self.feature_importance_df = pd.read_csv(imp_path)

            # Determine top 5 features
            sort_col = (
                "permutation_importance"
                if "permutation_importance" in self.feature_importance_df.columns
                else "impurity_importance"
            )
            sorted_imp = self.feature_importance_df.sort_values(by=sort_col, ascending=False)
            self.top_5_features = [
                (row["feature"], float(row[sort_col]))
                for _, row in sorted_imp.head(5).iterrows()
            ]

            # Reference stats
            self.reference_stats = load_reference_stats(self.artifact_dir)

            self.is_loaded = True
            logger.info("ModelService loaded all artifacts successfully.")
        except Exception as e:
            self.is_loaded = False
            logger.error(f"Failed to load artifacts: {e}", exc_info=True)
            raise e

    @property
    def class_threshold(self) -> float:
        return float(self.metadata.get("class_threshold", 0.5))

    @property
    def low_max(self) -> float:
        return float(self.metadata.get("risk_bands", {}).get("low_max", 0.3))

    @property
    def medium_max(self) -> float:
        return float(self.metadata.get("risk_bands", {}).get("medium_max", 0.6))

    @property
    def observed_ranges(self) -> Dict[str, List[float]]:
        return self.metadata.get("feature_ranges_observed", {})

    def check_warnings(self, input_dict: Dict[str, int]) -> List[str]:
        warnings = []
        for feat, val in input_dict.items():
            if feat in self.observed_ranges:
                low_obs, high_obs = self.observed_ranges[feat]
                if val < low_obs or val > high_obs:
                    label = FEATURE_LABELS.get(feat, feat)
                    warnings.append(
                        f"{label} ({val}) is outside the range seen in training data ({int(low_obs)}–{int(high_obs)}); "
                        f"the estimate may be less reliable."
                    )
        return warnings

    def predict(self, req: CustomerPredictionRequest) -> PredictionResponse:
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded")

        input_dict = req.model_dump()
        df = pd.DataFrame([{col: input_dict[col] for col in self.feature_columns}])

        proba_arr = self.model.predict_proba(df)
        prob = float(proba_arr[0, 1])
        prob_rounded = round(prob, 4)

        pred_label = int(prob >= self.class_threshold)
        prediction_str = "Churn" if pred_label == 1 else "No Churn"
        risk_str = map_risk_level(prob, self.low_max, self.medium_max)

        # Build top 5 factors
        top_factors: List[FactorItem] = []
        for feat, global_imp in self.top_5_features:
            user_val = input_dict[feat]
            ref = self.reference_stats.get(feat, {"typical_retained": 0.0, "typical_churned": 0.0})
            med_ret = float(ref.get("typical_retained", 0.0))
            med_churn = float(ref.get("typical_churned", 0.0))
            note = compute_factor_note(feat, user_val, med_ret)

            top_factors.append(
                FactorItem(
                    feature=feat,
                    label=FEATURE_LABELS.get(feat, feat),
                    global_importance=round(global_imp, 4),
                    your_value=user_val,
                    typical_churned=round(med_churn, 2) if not med_churn.is_integer() else med_churn,
                    typical_retained=round(med_ret, 2) if not med_ret.is_integer() else med_ret,
                    note=note,
                )
            )

        warnings = self.check_warnings(input_dict)

        return PredictionResponse(
            prediction=prediction_str,
            prediction_label=pred_label,
            churn_probability=prob_rounded,
            risk_level=risk_str,
            thresholds=ThresholdsInfo(
                class_threshold=self.class_threshold,
                low_max=self.low_max,
                medium_max=self.medium_max,
            ),
            top_factors=top_factors,
            warnings=warnings,
            disclaimer=DEFAULT_DISCLAIMER,
        )
