import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient, ApiError } from '../api/client';
import type { CustomerPredictionInput } from '../types';
import {
  CreditCard,
  PhoneCall,
  Activity,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface FieldConfig {
  key: keyof CustomerPredictionInput;
  label: string;
  helper?: string;
  unit?: string;
  min: number;
  max: number;
  obsMin: number;
  obsMax: number;
  type: 'number' | 'select';
  options?: { value: number; label: string; desc?: string }[];
}

const FIELD_GROUPS: {
  title: string;
  description: string;
  icon: any;
  fields: FieldConfig[];
}[] = [
  {
    title: 'Account Information',
    description: 'Contract length, demographic bracket, and billing plan tier',
    icon: CreditCard,
    fields: [
      {
        key: 'subscription_length',
        label: 'Subscription Length (months)',
        helper: 'Total tenure duration customer has remained active on contract',
        unit: 'months',
        min: 1,
        max: 60,
        obsMin: 3,
        obsMax: 47,
        type: 'number',
      },
      {
        key: 'tariff_plan',
        label: 'Tariff Plan',
        helper: 'Contract plan type: Plan 1 (Standard / Pay-As-You-Go) vs Plan 2 (Premium Contract)',
        min: 1,
        max: 2,
        obsMin: 1,
        obsMax: 2,
        type: 'select',
        options: [
          { value: 1, label: 'Plan 1 — Standard / Pay-As-You-Go (Standard rate; ~16.8% historical churn)' },
          { value: 2, label: 'Plan 2 — High-Usage / Premium Contract (Committed tier; ~2.6% historical churn)' },
        ],
      },
      {
        key: 'age_group',
        label: 'Age Group (Demographic Bracket)',
        helper: 'Observed age brackets in training data: 1=Teens(~15), 2=Young Adults(~25), 3=Core Adults(~30), 4=Middle-Aged(~45), 5=Seniors(55+)',
        min: 1,
        max: 5,
        obsMin: 1,
        obsMax: 5,
        type: 'select',
        options: [
          { value: 1, label: 'Group 1 — Age ~15 (Teens / Secondary Students)' },
          { value: 2, label: 'Group 2 — Age ~25 (Young Adults, 18–29 yrs)' },
          { value: 3, label: 'Group 3 — Age ~30 (Core Adults, 30–39 yrs)' },
          { value: 4, label: 'Group 4 — Age ~45 (Middle-Aged Adults, 40–49 yrs)' },
          { value: 5, label: 'Group 5 — Age ~55 (Older Adults & Seniors, 50+ yrs)' },
        ],
      },
      {
        key: 'charge_amount',
        label: 'Charge Amount Level (Billed Tier 0–10)',
        helper: 'Ordinal billed charge bracket from Level 0 ($0 / minimum bill) up to Level 10 (maximum billed tier)',
        min: 0,
        max: 10,
        obsMin: 0,
        obsMax: 10,
        type: 'select',
        options: [
          { value: 0, label: 'Level 0 — $0 / Minimal charges (Base plan tier)' },
          { value: 1, label: 'Level 1 — Low charge tier (1st–10th percentile)' },
          { value: 2, label: 'Level 2 — Low-Moderate charge tier' },
          { value: 3, label: 'Level 3 — Moderate charge tier' },
          { value: 4, label: 'Level 4 — Above-average charge tier' },
          { value: 5, label: 'Level 5 — Mid-High charge tier (~50th percentile)' },
          { value: 6, label: 'Level 6 — Elevated charge tier' },
          { value: 7, label: 'Level 7 — High charge tier' },
          { value: 8, label: 'Level 8 — Very high charge tier' },
          { value: 9, label: 'Level 9 — Top 5% billed charge tier' },
          { value: 10, label: 'Level 10 — Maximum charge tier (Top 1% spenders)' },
        ],
      },
    ],
  },
  {
    title: 'Usage Metrics',
    description: 'Call durations, message frequencies, and contact network size',
    icon: Activity,
    fields: [
      {
        key: 'seconds_of_use',
        label: 'Total Seconds of Use',
        helper: 'Voice talk time in seconds (e.g. 3,600s = 1 hour; typical retained customer is ~3,600s)',
        unit: 'seconds',
        min: 0,
        max: 20000,
        obsMin: 0,
        obsMax: 17090,
        type: 'number',
      },
      {
        key: 'frequency_of_use',
        label: 'Frequency of Use (Total Calls)',
        helper: 'Total volume of inbound and outbound voice call sessions logged',
        unit: 'calls',
        min: 0,
        max: 300,
        obsMin: 0,
        obsMax: 255,
        type: 'number',
      },
      {
        key: 'frequency_of_sms',
        label: 'Frequency of SMS',
        helper: 'Total SMS text messages dispatched during observation period',
        unit: 'messages',
        min: 0,
        max: 600,
        obsMin: 0,
        obsMax: 522,
        type: 'number',
      },
      {
        key: 'distinct_called_numbers',
        label: 'Distinct Numbers Called',
        helper: 'Count of unique telephone numbers reached (measures contact social circle)',
        unit: 'unique numbers',
        min: 0,
        max: 120,
        obsMin: 0,
        obsMax: 97,
        type: 'number',
      },
    ],
  },
  {
    title: 'Service & Support',
    description: 'Technical network quality and recorded customer dissatisfaction tickets',
    icon: PhoneCall,
    fields: [
      {
        key: 'call_failure',
        label: 'Call Failures',
        helper: 'Count of dropped, disconnected, or uncompleted call attempts due to network faults',
        unit: 'failures',
        min: 0,
        max: 50,
        obsMin: 0,
        obsMax: 36,
        type: 'number',
      },
      {
        key: 'complains',
        label: 'Has Complained (Support Dissatisfaction)',
        helper: 'Whether customer logged a formal dissatisfaction complaint with support',
        min: 0,
        max: 1,
        obsMin: 0,
        obsMax: 1,
        type: 'select',
        options: [
          { value: 0, label: 'No (0) — No complaints logged (0 tickets)' },
          { value: 1, label: 'Yes (1) — Customer filed a complaint (Dissatisfied ticket logged)' },
        ],
      },
    ],
  },
];

const HIGH_RISK_EXAMPLE: CustomerPredictionInput = {
  call_failure: 23,
  complains: 1,
  subscription_length: 33,
  charge_amount: 0,
  seconds_of_use: 955,
  frequency_of_use: 47,
  frequency_of_sms: 16,
  distinct_called_numbers: 17,
  age_group: 2,
  tariff_plan: 1,
};

const LOW_RISK_EXAMPLE: CustomerPredictionInput = {
  call_failure: 8,
  complains: 0,
  subscription_length: 38,
  charge_amount: 0,
  seconds_of_use: 4370,
  frequency_of_use: 71,
  frequency_of_sms: 5,
  distinct_called_numbers: 17,
  age_group: 3,
  tariff_plan: 1,
};

export const PredictPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If user navigated back via "Edit inputs", restore formData
  const initialValues: Partial<CustomerPredictionInput> = location.state?.formData || {};

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    FIELD_GROUPS.forEach((group) => {
      group.fields.forEach((f) => {
        const val = initialValues[f.key];
        initial[f.key] = val !== undefined && val !== null ? String(val) : '';
      });
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const validateField = (key: keyof CustomerPredictionInput, valStr: string): string | null => {
    let targetField: FieldConfig | undefined;
    for (const group of FIELD_GROUPS) {
      const found = group.fields.find((f) => f.key === key);
      if (found) {
        targetField = found;
        break;
      }
    }
    if (!targetField) return null;

    if (valStr.trim() === '') {
      return `${targetField.label} is required`;
    }

    const num = Number(valStr);
    if (!Number.isInteger(num)) {
      return `${targetField.label} must be a whole integer`;
    }

    if (num < targetField.min || num > targetField.max) {
      return `${targetField.label} must be between ${targetField.min} and ${targetField.max}`;
    }

    return null;
  };

  const handleBlur = (key: keyof CustomerPredictionInput) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const errorMsg = validateField(key, formData[key] || '');
    setErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) next[key] = errorMsg;
      else delete next[key];
      return next;
    });
  };

  const handleChange = (key: keyof CustomerPredictionInput, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (touched[key]) {
      const errorMsg = validateField(key, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) next[key] = errorMsg;
        else delete next[key];
        return next;
      });
    }
  };

  const handleLoadExample = (example: CustomerPredictionInput) => {
    const newForm: Record<string, string> = {};
    Object.entries(example).forEach(([k, v]) => {
      newForm[k] = String(v);
    });
    setFormData(newForm);
    setErrors({});
    setTouched({});
    setGlobalError(null);
  };

  const handleReset = () => {
    const emptyForm: Record<string, string> = {};
    FIELD_GROUPS.forEach((g) => {
      g.fields.forEach((f) => {
        emptyForm[f.key] = '';
      });
    });
    setFormData(emptyForm);
    setErrors({});
    setTouched({});
    setGlobalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    const parsedPayload: Partial<CustomerPredictionInput> = {};

    FIELD_GROUPS.forEach((group) => {
      group.fields.forEach((field) => {
        newTouched[field.key] = true;
        const err = validateField(field.key, formData[field.key] || '');
        if (err) {
          newErrors[field.key] = err;
        } else {
          parsedPayload[field.key] = Number(formData[field.key]);
        }
      });
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const result = await apiClient.predict(parsedPayload as CustomerPredictionInput);
      navigate('/results', {
        state: {
          result,
          formData: parsedPayload as CustomerPredictionInput,
        },
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 422 && err.validationErrors) {
        const fieldErrors: Record<string, string> = {};
        err.validationErrors.forEach((ve) => {
          fieldErrors[ve.field] = ve.message;
        });
        setErrors(fieldErrors);
        setGlobalError('Please review and correct the invalid inputs.');
      } else {
        setGlobalError(err.message || 'Could not reach the prediction service');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Inference Workflow
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Prediction Form
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-xl">
            Input the 10 account, usage, and service variables. Ranges and demographic codes are calibrated against training data.
          </p>
        </div>

        {/* High-visibility Example Loader Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-load-high-risk"
            onClick={() => handleLoadExample(HIGH_RISK_EXAMPLE)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/25 transition-all hover:scale-102 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            Load High-Risk Sample
          </button>
          <button
            type="button"
            id="btn-load-low-risk"
            onClick={() => handleLoadExample(LOW_RISK_EXAMPLE)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:scale-102 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            Load Low-Risk Sample
          </button>
          <button
            type="button"
            id="btn-reset-form"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div
          role="alert"
          className="mb-8 p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm flex items-start gap-3 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">{globalError}</p>
          </div>
        </div>
      )}

      {/* Form with 3 Card Groups */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-7">
          {FIELD_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.title}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 transition-all"
              >
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">{group.title}</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{group.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {group.fields.map((field) => {
                    const error = touched[field.key] ? errors[field.key] : null;
                    const errorId = `error-${field.key}`;
                    const inputId = `input-${field.key}`;

                    return (
                      <div key={field.key} className="flex flex-col bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                        {/* Label & Range Badges */}
                        <div className="mb-2">
                          <label
                            htmlFor={inputId}
                            className="text-xs font-bold text-slate-900 flex items-center justify-between"
                          >
                            <span>{field.label}</span>
                          </label>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center text-[11px] font-semibold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                              Valid Range: {field.min}–{field.max} {field.unit ? field.unit : ''}
                            </span>
                            <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                              Typical: {field.obsMin}–{field.obsMax}
                            </span>
                          </div>
                        </div>

                        {/* Helper Description */}
                        {field.helper && (
                          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                            {field.helper}
                          </p>
                        )}

                        {field.type === 'select' && field.options ? (
                          <div className="relative mt-auto">
                            <select
                              id={inputId}
                              name={field.key}
                              value={formData[field.key]}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              onBlur={() => handleBlur(field.key)}
                              aria-invalid={!!error}
                              aria-describedby={error ? errorId : undefined}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 bg-white ${
                                error
                                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30 text-rose-900 font-semibold'
                                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 text-slate-900'
                              }`}
                            >
                              <option value="">-- Select option below --</option>
                              {field.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="mt-auto">
                            <input
                              type="number"
                              id={inputId}
                              name={field.key}
                              value={formData[field.key]}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              onBlur={() => handleBlur(field.key)}
                              min={field.min}
                              max={field.max}
                              step={1}
                              placeholder={`Enter whole number (${field.min} - ${field.max})`}
                              aria-invalid={!!error}
                              aria-describedby={error ? errorId : undefined}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white font-medium ${
                                error
                                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30 text-rose-900 font-semibold'
                                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 text-slate-900'
                              }`}
                            />
                          </div>
                        )}

                        {/* Error Message */}
                        {error && (
                          <p id={errorId} className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1">
                            <span>•</span> {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons - High Visibility & Prominence */}
        <div className="mt-9 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm transition-colors cursor-pointer"
          >
            Clear All Fields
          </button>

          <button
            type="submit"
            id="btn-submit-predict"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 ring-2 ring-blue-500 ring-offset-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Evaluating Model Prediction...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Predict Churn
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
