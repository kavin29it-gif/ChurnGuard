# Customer Churn Prediction Web App

A production-ready decision-support web application for customer churn prediction built for retention specialists, analysts, and managers. The application serves a pre-trained **Random Forest** pipeline (trained on telecommunication customer usage and service data) with calibrated probabilities, dynamic risk classification, and transparent global feature explainability.

---

## 1. Overview & Architecture

- **Backend:** Python 3.12/3.13, FastAPI, Uvicorn, Pydantic v2, Scikit-Learn 1.7.2, Pandas, NumPy, Joblib.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide Icons.
- **Model Pipeline:** Full scikit-learn pipeline (`ColumnTransformer` + 400-estimator `RandomForestClassifier`), loaded once at server startup.
- **Zero Retraining:** The web app strictly consumes the pre-trained serialized model and does not modify it.

### Project Structure

```
Customer Churn/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI endpoints, lifespan loader, CORS, custom error handlers
│   │   ├── config.py          # Environment settings, artifact path resolution
│   │   ├── schemas.py         # Pydantic v2 request/response schemas with strict validation
│   │   ├── model_service.py   # Model inference, risk bands, top factor explainability
│   │   └── reference.py       # Cohort reference stats loader (medians)
│   ├── artifacts/             # Bundled model, feature columns, metadata, and stats
│   │   ├── random_forest_churn_model.pkl
│   │   ├── feature_columns.json
│   │   ├── model_metadata.json
│   │   ├── feature_importance.csv
│   │   ├── customer_churn_predictions.csv
│   │   └── reference_stats.json
│   ├── scripts/
│   │   └── build_reference_stats.py  # Calculates feature medians for churned vs. retained cohorts
│   ├── tests/
│   │   ├── test_model_service.py     # Unit tests for mapping and notes
│   │   └── test_api.py               # Comprehensive pytest suite & parity test
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts      # Unified typed API client with error handling
│   │   ├── components/
│   │   │   ├── Navbar.tsx     # Header with live model status badge
│   │   │   └── Footer.tsx     # Footer disclaimer and attribution
│   │   ├── pages/
│   │   │   ├── HomePage.tsx   # Project overview, churn explanation, 3-step workflow
│   │   │   ├── PredictPage.tsx# 10 input fields grouped in 3 cards, live validation, sample loaders
│   │   │   └── ResultsPage.tsx# Outcome banner, gauge bar, risk badge, factor comparison
│   │   ├── types.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx            # Route configuration
│   │   └── index.css          # Tailwind CSS styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .env.example
└── README.md
```

---

## 2. Input Fields (Exactly 10 Features)

| Feature (API Name) | UI Label | Type | Validation Bounds | Training Observed | Group |
|---|---|---|---|---|---|
| `subscription_length` | Subscription Length (months) | Integer | 1 – 60 | 3 – 47 | Account |
| `tariff_plan` | Tariff Plan | Select | 1 or 2 | 1 – 2 | Account |
| `age_group` | Age Group | Select | 1 – 5 | 1 – 5 | Account |
| `charge_amount` | Charge Amount Level | Select | 0 – 10 | 0 – 10 | Account |
| `seconds_of_use` | Total Seconds of Use | Integer | 0 – 20,000 | 0 – 17,090 | Usage |
| `frequency_of_use` | Frequency of Use (calls) | Integer | 0 – 300 | 0 – 255 | Usage |
| `frequency_of_sms` | Frequency of SMS | Integer | 0 – 600 | 0 – 522 | Usage |
| `distinct_called_numbers` | Distinct Numbers Called | Integer | 0 – 120 | 0 – 97 | Usage |
| `call_failure` | Call Failures | Integer | 0 – 50 | 0 – 36 | Service |
| `complains` | Has Complained | Select | 0 (No) or 1 (Yes)| 0 – 1 | Service |

---

## 3. Quick Start (Run Locally in < 5 Minutes)

### Prerequisites
- Python 3.12 or 3.13
- Node.js 18+ and npm

### Step 1: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Rebuild reference stats:
python scripts/build_reference_stats.py

# Start FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is available at `http://127.0.0.1:8000/docs` and health check at `http://127.0.0.1:8000/health`.

### Step 2: Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 4. Running Tests

Run the complete backend test suite (including parity tests, boundary checks, and input validations):
```bash
cd backend
.\.venv\Scripts\pytest -v
```

All 17 test cases test:
- Feature column ordering matches exact specification.
- Parity test: 10 rows from `customer_churn_predictions.csv` match direct `model.predict_proba` with `< 1e-9` tolerance.
- Boundary probability testing at `0.30` (Medium) and `0.60` (High).
- Hard validations (missing fields, negative bounds, excessive numbers, floats, extra forbidden keys).
- Soft out-of-distribution warning generation.

---

## 5. Explainability & Risk Calibration

- **Thresholds:** Read dynamically from `model_metadata.json` (`class_threshold = 0.5`, `low_max = 0.30`, `medium_max = 0.60`).
- **Explainability Approach:** Displays the top 5 global features by permutation/impurity importance from `feature_importance.csv`. Alongside each factor, the customer's input value is compared against cohort medians (`typical_retained` vs. `typical_churned`) computed by `build_reference_stats.py`.
- **Honest Framing:** The UI clearly notes: *"Importance shows what the model uses, not what causes churn. This is a statistical estimate, not a guarantee of customer behaviour."*

---

## 6. Assumptions

1. **Feature Column Interpretation:** Column names reflect inferred telecommunication domain metrics. Numerical charge levels and age groups are treated as coded ordinal integers per training data schema without inventing artificial age boundaries.
2. **Scikit-Learn Version Pinning:** The provided model was serialized with Scikit-Learn 1.7.2 under Python 3.13.9. Running Scikit-Learn 1.7.2 ensures 100% binary pickle compatibility with zero version mismatch warnings.
3. **Out-of-Fold Probabilities:** The CSV `customer_churn_predictions.csv` contains out-of-fold cross-validated probabilities; tests verify direct `predict_proba` execution against the loaded pipeline instance.
4. **State Persistence:** Results and pre-filled form states are passed cleanly via React Router in-memory navigation state without storing sensitive customer inputs in local storage or remote databases.

---

## 7. Deployment Guide

### Backend (Render / Railway)
- **Runtime:** Python 3.12 / 3.13
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `ALLOWED_ORIGINS`: Set to your deployed frontend domain (e.g., `https://churn-webapp.vercel.app`)
  - `ARTIFACT_DIR`: `./artifacts`

### Frontend (Vercel / Netlify)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: Set to your deployed backend URL (e.g., `https://churn-api.onrender.com`)
- **SPA Rewrites:** Ensure all routes (`/*`) rewrite to `/index.html`.
