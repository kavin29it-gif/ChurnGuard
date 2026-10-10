import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PredictionResponse, CustomerPredictionInput } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Info,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const result: PredictionResponse | undefined = location.state?.result;
  const formData: CustomerPredictionInput | undefined = location.state?.formData;

  useEffect(() => {
    // PRD requirement: If opened without a result (e.g. refresh), redirect to /predict
    if (!result) {
      navigate('/predict', { replace: true });
    }
  }, [result, navigate]);

  if (!result) {
    return null;
  }

  const {
    prediction,
    churn_probability,
    risk_level,
    thresholds,
    top_factors,
    warnings,
    disclaimer,
  } = result;

  const probPercent = (churn_probability * 100).toFixed(1);
  const isChurn = prediction === 'Churn';

  // Badge styles
  const riskBadgeStyles = {
    Low: {
      bg: 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300',
      dot: 'bg-emerald-600',
      label: 'Low Risk Tier',
      icon: CheckCircle2,
    },
    Medium: {
      bg: 'bg-amber-100 text-amber-900 border-2 border-amber-300',
      dot: 'bg-amber-600',
      label: 'Medium Risk Tier',
      icon: AlertCircle,
    },
    High: {
      bg: 'bg-rose-100 text-rose-900 border-2 border-rose-300',
      dot: 'bg-rose-600',
      label: 'High Risk Tier',
      icon: AlertTriangle,
    },
  }[risk_level] || {
    bg: 'bg-slate-100 text-slate-900 border-2 border-slate-300',
    dot: 'bg-slate-600',
    label: risk_level,
    icon: Info,
  };

  const RiskIcon = riskBadgeStyles.icon;

  const handleEditInputs = () => {
    navigate('/predict', { state: { formData } });
  };

  const handlePredictAnother = () => {
    navigate('/predict');
  };

  // Find max global importance for relative bar width
  const maxImportance = Math.max(...top_factors.map((f) => f.global_importance), 0.1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation and Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleEditInputs}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Edit inputs
        </button>

        <button
          onClick={handlePredictAnother}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Predict another customer
        </button>
      </div>

      {/* Outcome Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-10 border shadow-xl relative overflow-hidden mb-8 ${
          isChurn
            ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white border-rose-800'
            : 'bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white border-emerald-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
                Evaluation Outcome
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${riskBadgeStyles.bg}`}
              >
                <RiskIcon className="w-4 h-4" />
                {riskBadgeStyles.label}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-2">
              {prediction}
            </h1>
            <p className="text-slate-200 text-sm max-w-md leading-relaxed font-medium">
              {isChurn
                ? 'Model indicates high likelihood of customer defection based on historical patterns.'
                : 'Customer displays retention indicators consistent with continued active subscription.'}
            </p>
          </div>

          {/* Probability Metric Display */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col items-center justify-center min-w-[210px] text-center shadow-inner">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1">
              Estimated Probability
            </span>
            <span className="text-4xl sm:text-5xl font-black text-white">
              {probPercent}%
            </span>
            <span className="text-[11px] text-slate-300 mt-1 font-medium">
              Cutoff threshold: {(thresholds.class_threshold * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Gauge / Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex justify-between text-xs text-slate-300 mb-2 font-semibold">
            <span>0%</span>
            <span className="text-emerald-300">Low (&lt;{(thresholds.low_max * 100).toFixed(0)}%)</span>
            <span className="text-amber-300">Medium (&lt;{(thresholds.medium_max * 100).toFixed(0)}%)</span>
            <span className="text-rose-300">High (≥{(thresholds.medium_max * 100).toFixed(0)}%)</span>
            <span>100%</span>
          </div>

          <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            {/* Threshold marker lines */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
              style={{ left: `${thresholds.low_max * 100}%` }}
              title="Low Risk Upper Bound (30%)"
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
              style={{ left: `${thresholds.medium_max * 100}%` }}
              title="Medium Risk Upper Bound (60%)"
            />

            {/* Filled Progress Bar */}
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                churn_probability < thresholds.low_max
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : churn_probability < thresholds.medium_max
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-red-500'
              }`}
              style={{ width: `${Math.min(churn_probability * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {warnings && warnings.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-sm shadow-xs">
          <div className="flex items-center gap-2 font-bold mb-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Out-of-Distribution Warning
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-amber-900 font-medium">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Factors Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900">
              Factors the model relies on most (overall)
            </h2>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm">
            Importance shows what the model uses, not what causes churn. These reflect global feature rankings across the training population.
          </p>
        </div>

        {/* Factors Table / Cards */}
        <div className="space-y-4">
          {top_factors.map((factor, idx) => {
            const barWidth = `${Math.min((factor.global_importance / maxImportance) * 100, 100)}%`;

            return (
              <div
                key={factor.feature}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center border border-blue-200">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {factor.label}
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-lg bg-white border border-slate-300 font-bold text-slate-800 shadow-xs self-start sm:self-auto">
                    {factor.note}
                  </span>
                </div>

                {/* Relative Global Importance Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Global Model Importance</span>
                    <span className="font-mono text-blue-700">{(factor.global_importance * 100).toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>

                {/* Benchmark Comparison Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Your Value
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {factor.your_value}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="block text-[10px] uppercase tracking-wider text-emerald-700 font-bold">
                      Typical Retained
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {factor.typical_retained}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="block text-[10px] uppercase tracking-wider text-rose-700 font-bold">
                      Typical Churned
                    </span>
                    <span className="text-sm font-extrabold text-rose-700">
                      {factor.typical_churned}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visible Mandatory Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          <span className="font-bold text-slate-900">Model Disclaimer: </span>
          {disclaimer}
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleEditInputs}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-sm bg-white hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Edit inputs
        </button>

        <button
          onClick={handlePredictAnother}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 ring-2 ring-blue-500 ring-offset-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Predict another customer
        </button>
      </div>
    </div>
  );
};
