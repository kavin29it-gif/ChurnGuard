from contextlib import asynccontextmanager
import logging
import traceback
from typing import Dict, Any, List
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import ARTIFACT_DIR, ALLOWED_ORIGINS
from app.model_service import (
    ModelService,
    HARD_RANGES,
    DEFAULT_DISCLAIMER,
)
from app.schemas import (
    CustomerPredictionRequest,
    PredictionResponse,
    HealthResponse,
    ModelInfoResponse,
    FeatureInfo,
    FEATURE_LABELS,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("churn_api")

model_service = ModelService(ARTIFACT_DIR)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ModelService...")
    try:
        model_service.load_artifacts()
        logger.info("ModelService initialized successfully.")
    except Exception as e:
        logger.error(f"Critical error loading model artifacts: {e}", exc_info=True)
    yield
    logger.info("Shutting down Churn API...")

app = FastAPI(
    title="Customer Churn Prediction API",
    description="API for evaluating customer churn probability using Random Forest",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simplified 422 RequestValidationError handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    formatted_errors = []
    for err in exc.errors():
        loc = err.get("loc", ())
        field = str(loc[-1]) if loc and loc[-1] != "body" else "body"
        msg = err.get("msg", "Invalid input")
        # Clean up Pydantic prefix if present
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]
        formatted_errors.append({"field": field, "message": msg})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": formatted_errors},
    )

# 500 Generic internal server error handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Prediction failed. Please try again."},
    )

@app.get("/health", response_model=HealthResponse)
def health_check():
    version = model_service.metadata.get("sklearn_version", "1.7.2") if model_service.is_loaded else None
    return HealthResponse(
        status="ok",
        model_loaded=model_service.is_loaded,
        model_version=version,
    )

@app.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded",
        )

    features_info: List[FeatureInfo] = []
    for feat in model_service.feature_columns:
        obs_range = model_service.observed_ranges.get(feat, [0.0, 0.0])
        hard_range = HARD_RANGES.get(feat, [0, 100])
        features_info.append(
            FeatureInfo(
                name=feat,
                label=FEATURE_LABELS.get(feat, feat),
                observed_range=obs_range,
                hard_range=hard_range,
            )
        )

    top_feats = [feat for feat, _ in model_service.top_5_features]

    return ModelInfoResponse(
        model_name="RandomForestClassifier",
        model_version=model_service.metadata.get("sklearn_version", "1.7.2"),
        features=features_info,
        risk_bands=model_service.metadata.get("risk_bands", {"low_max": 0.3, "medium_max": 0.6}),
        class_threshold=model_service.class_threshold,
        top_global_features=top_feats,
        disclaimer=DEFAULT_DISCLAIMER,
    )

@app.post("/predict", response_model=PredictionResponse)
def predict_churn(request: CustomerPredictionRequest):
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded",
        )
    return model_service.predict(request)
