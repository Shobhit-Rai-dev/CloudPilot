'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Budget } from '../../types';
import { PieChart, CheckCircle2, AlertTriangle, ShieldAlert, DollarSign } from 'lucide-react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [costs, setCosts] = useState<any>(null);

  useEffect(() => {
    Promise.all([api.getBudgets(), api.getCosts()]).then(([bData, cData]) => {
      setBudgets(bData);
      setCosts(cData);
    });
  }, []);

  const budget = budgets[0] || {
    name: 'Production Monthly Cloud Budget',
    monthly_limit: 30000,
    warning_threshold: 0.8,
    hard_limit_threshold: 1.0,
    current_spend: 18000,
  };

  const currentSpend = costs?.totalMonthlySpend || budget.current_spend;
  const limit = budget.monthly_limit;
  const pct = Math.round((currentSpend / limit) * 100);
  const isWarning = pct >= budget.warning_threshold * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <PieChart className="w-6 h-6 text-blue-400" />
          <span>Cloud Budgets & Hard Spend Limits</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated gatekeeping: Scaling actions exceeding monthly allocations are automatically blocked
        </p>
      </div>

      {/* Main Budget Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">{budget.name}</h2>
            <span className="text-xs text-slate-500">Period: Current Billing Month (INR)</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ACTIVE ENFORCEMENT
          </span>
        </div>

        {/* Big numbers */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Consumed Spend</span>
            <span className="text-3xl font-black text-white">₹{currentSpend.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Allocated Limit</span>
            <span className="text-3xl font-black text-slate-400">₹{limit.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Utilization: {pct}%</span>
            <span>Warning Threshold: 80%</span>
          </div>
          <div className="h-4 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 100
                  ? 'bg-rose-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        {/* Policy Verification Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">Pre-Approval Gatekeeper</span>
              <span className="text-slate-400">
                Any scaling action calculating projected total &gt; ₹30,000 is blocked automatically with reason.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">Sizing Margin</span>
              <span className="text-slate-400">
                Remaining headroom allows scaling production-api up to 4 instances (+₹7,200) safely.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
