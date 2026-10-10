import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden mb-12 border border-slate-700/60">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white mb-5">
            Customer Churn <br />
            <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200 bg-clip-text text-transparent">
              Prediction & Analytics
            </span>
          </h1>

          <p className="text-slate-200 text-base sm:text-lg mb-8 leading-relaxed font-normal">
            Customer churn occurs when subscribers stop doing business with a service provider. 
            This decision-support tool empowers retention specialists and analysts to quantify churn risk 
            in real time and inspect key predictive drivers without modifying the trained model.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/predict"
              id="cta-predict-churn"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/40 border border-blue-400/50 transition-all hover:-translate-y-0.5 active:translate-y-0 text-base cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              Predict Churn Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Value Explanation & Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">What is Customer Churn?</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            In telecommunications and subscription services, customer churn occurs when a subscriber disconnects, 
            fails to renew, or migrates to a competing provider. Proactive retention is far more cost-effective 
            than acquiring replacement customers.
          </p>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">How this Tool Helps</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            By inputting 10 validated account and behavioral indicators, retention agents receive an immediate statistical 
            probability, an assigned risk tier (Low, Medium, High), and comparative factors contextualizing the score against training benchmarks.
          </p>
        </div>
      </div>

      {/* 3 Steps: How It Works */}
      <div className="mb-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">How It Works</h2>
          <p className="text-slate-500 text-sm mt-1">Three streamlined steps from customer data to actionable retention insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-sm mb-4 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Input Customer Details</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Enter 10 core metrics spanning subscription tenure, tariff tier, call failures, customer complaints, and aggregate usage.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-sm mb-4 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Statistical Evaluation</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Our pre-trained 400-estimator Random Forest model evaluates the feature set against tuned decision thresholds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-sm mb-4 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Transparent Risk & Drivers</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Review calibrated churn probability, risk tier categorization, and benchmark comparison against retained vs. churned cohorts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
