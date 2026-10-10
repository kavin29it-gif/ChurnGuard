#!/usr/bin/env python3
"""
Compute reference statistics (medians for actual_churn=0 and actual_churn=1)
for each of the 10 model features using customer_churn_predictions.csv.
Outputs artifacts/reference_stats.json.
"""

from pathlib import Path
import json
import pandas as pd

def build_reference_stats():
    # Resolve artifacts directory
    script_dir = Path(__file__).resolve().parent
    backend_dir = script_dir.parent
    repo_dir = backend_dir.parent

    # Try backend/artifacts first, then repo artifacts
    csv_candidates = [
        backend_dir / "artifacts" / "customer_churn_predictions.csv",
        repo_dir / "artifacts" / "customer_churn_predictions.csv",
    ]
    csv_path = next((p for p in csv_candidates if p.exists()), None)
    if not csv_path:
        raise FileNotFoundError("Could not find customer_churn_predictions.csv")

    feature_candidates = [
        backend_dir / "artifacts" / "feature_columns.json",
        repo_dir / "artifacts" / "feature_columns.json",
    ]
    feat_path = next((p for p in feature_candidates if p.exists()), None)
    if not feat_path:
        raise FileNotFoundError("Could not find feature_columns.json")

    with open(feat_path, "r", encoding="utf-8") as f:
        features = json.load(f)

    df = pd.read_csv(csv_path)

    retained_df = df[df["actual_churn"] == 0]
    churned_df = df[df["actual_churn"] == 1]

    reference_stats = {}
    for feat in features:
        med_retained = float(retained_df[feat].median())
        med_churned = float(churned_df[feat].median())
        reference_stats[feat] = {
            "typical_retained": round(med_retained, 2) if not med_retained.is_integer() else int(med_retained),
            "typical_churned": round(med_churned, 2) if not med_churned.is_integer() else int(med_churned),
        }

    # Save to backend/artifacts and repo root artifacts if exists
    out_paths = [backend_dir / "artifacts" / "reference_stats.json"]
    if (repo_dir / "artifacts").exists():
        out_paths.append(repo_dir / "artifacts" / "reference_stats.json")

    for out_p in out_paths:
        out_p.parent.mkdir(parents=True, exist_ok=True)
        with open(out_p, "w", encoding="utf-8") as f:
            json.dump(reference_stats, f, indent=2)
        print(f"Wrote reference stats to {out_p}")

    print(f"Generated stats for {len(reference_stats)} features.")
    return reference_stats

if __name__ == "__main__":
    build_reference_stats()
