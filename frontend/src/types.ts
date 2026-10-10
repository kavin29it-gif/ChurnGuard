export interface CustomerPredictionInput {
  call_failure: number;
  complains: number;
  subscription_length: number;
  charge_amount: number;
  seconds_of_use: number;
  frequency_of_use: number;
  frequency_of_sms: number;
  distinct_called_numbers: number;
  age_group: number;
  tariff_plan: number;
}

export interface FactorItem {
  feature: string;
  label: string;
  global_importance: number;
  your_value: number;
  typical_churned: number;
  typical_retained: number;
  note: string;
}

export interface ThresholdsInfo {
  class_threshold: number;
  low_max: number;
  medium_max: number;
}

export interface PredictionResponse {
  prediction: 'Churn' | 'No Churn';
  prediction_label: 0 | 1;
  churn_probability: number;
  risk_level: 'Low' | 'Medium' | 'High';
  thresholds: ThresholdsInfo;
  top_factors: FactorItem[];
  warnings: string[];
  disclaimer: string;
}

export interface ApiValidationError {
  field: string;
  message: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_version?: string;
}

export interface FeatureMeta {
  name: string;
  label: string;
  observed_range: [number, number];
  hard_range: [number, number];
}

export interface ModelInfoResponse {
  model_name: string;
  model_version: string;
  features: FeatureMeta[];
  risk_bands: {
    low_max: number;
    medium_max: number;
  };
  class_threshold: number;
  top_global_features: string[];
  disclaimer: string;
}
