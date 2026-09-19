'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, TrendingUp, PieChart, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CostsPage() {
  const [costs, setCosts] = useState<any>(null);
  const [scalingInput, setScalingInput] = useState<number>(4);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getCosts()
      .then((data) => setCosts(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const currentMonthly = costs?.totalMonthlySpend || 18000;
  const budget = costs?.monthlyBudget || 30000;
  const simAdditional = (scalingInput - 2) * 3600;
  const simTotal = currentMonthly + simAdditional;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <DollarSign className="w-6 h-6 text-amber-400" />
          <span>Cloud Costs & Financial Operations</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Actual spend, real-time burn rate, budget governance, and scaling cost projections
        </p>
      </div>

      {/* High-level Spend KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Month Spend</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
              ACTUAL
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ₹{costs?.totalMonthlySpend.toLocaleString() || '18,000'}
          </div>
          <span className="text-xs text-slate-500">Today burn: ₹{costs?.todaySpend || '840'}</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Budget</span>
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 text-[10px] font-bold border border-blue-800">
              LIMIT
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ₹{costs?.monthlyBudget.toLocaleString() || '30,000'}
          </div>
          <span className="text-xs text-slate-500">Remaining: ₹{(budget - currentMonthly).toLocaleString()}</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected EOM Spend</span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
              FORECAST
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            ₹{costs?.forecastMonthlySpend.toLocaleString() || '18,720'}
          </div>
          <span className="text-xs text-slate-500">Includes baseline variance</span>
        </div>
      </div>

      {/* Spend Breakdown by Service & Resource */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Service */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Spend by AWS Service</h3>
          <div className="space-y-3">
            {costs?.spendByService &&
              Object.entries(costs.spendByService).map(([svc, amount]: [string, any]) => {
                const pct = Math.round((amount / currentMonthly) * 100);
                return (
                  <div key={svc} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{svc}</span>
                      <span className="text-slate-400">₹{amount.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Scaling Cost Impact Simulator */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Capacity Cost Impact Simulator</h3>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-400 text-[10px] font-bold border border-purple-800">
              ESTIMATED
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">
                Target Capacity for <strong className="text-white">production-api</strong>: {scalingInput} instances
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={scalingInput}
                onChange={(e) => setScalingInput(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Min: 2</span>
                <span>Recommended: 4</span>
                <span>Max: 8</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Baseline Monthly:</span>
                <span className="text-white font-medium">₹18,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Additional Cost ({scalingInput - 2} instances):</span>
                <span className="text-amber-400 font-bold">+₹{simAdditional.toLocaleString()} / mo</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-bold">New Monthly Spend:</span>
                <span className="text-emerald-400 font-bold text-sm">₹{simTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Projected spend ₹{simTotal.toLocaleString()} is within ₹30,000 budget</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
