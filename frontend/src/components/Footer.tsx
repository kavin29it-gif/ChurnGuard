import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-slate-700">Customer Churn Prediction Web App</span> • Component 3 College Project
        </div>
        <div className="text-slate-400">
          Powered by Scikit-Learn 1.7.2 & FastAPI • No customer data is persistently stored
        </div>
      </div>
    </footer>
  );
};
