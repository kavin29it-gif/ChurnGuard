import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <span className="font-extrabold text-slate-900 text-sm">ChurnGuard</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">Smart Customer Retention Platform</span>
        </div>
        <div className="text-slate-400">
          Predictive analytics for proactive subscriber retention
        </div>
      </div>
    </footer>
  );
};
