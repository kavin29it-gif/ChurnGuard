import type {
  CustomerPredictionInput,
  PredictionResponse,
  HealthResponse,
  ModelInfoResponse,
  ApiValidationError,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status?: number;
  validationErrors?: ApiValidationError[];

  constructor(message: string, status?: number, validationErrors?: ApiValidationError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

export const apiClient = {
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) {
        throw new ApiError(`Health check failed with status ${res.status}`, res.status);
      }
      return await res.json();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Could not reach the prediction service');
    }
  },

  async getModelInfo(): Promise<ModelInfoResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/model-info`);
      if (!res.ok) {
        throw new ApiError(`Failed to fetch model info with status ${res.status}`, res.status);
      }
      return await res.json();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Could not reach the prediction service');
    }
  },

  async predict(input: CustomerPredictionInput): Promise<PredictionResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (res.status === 422) {
        const errorData = await res.json();
        const details: ApiValidationError[] = errorData.detail || [];
        throw new ApiError('Validation error', 422, details);
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Prediction request failed.' }));
        throw new ApiError(errorData.detail || 'Prediction failed. Please try again.', res.status);
      }

      return await res.json();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Could not reach the prediction service');
    }
  },
};
