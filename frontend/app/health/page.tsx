'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CloudResource } from '../../types';
import {
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  ShieldAlert,
} from 'lucide-react';

export default function HealthPage() {
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getResources()
      .then((data) => setResources(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <HeartPulse className="w-6 h-6 text-rose-400" />
          <span>Service Health Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Multi-signal evaluation: CPU, Memory, Latency, Error Rate, and Availability with transparent causality
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res) => {
          const isDegraded = res.health === 'DEGRADED';
          const isWarning = res.health === 'WARNING';
          const isHealthy = res.health === 'HEALTHY';

          return (
            <div
              key={res.id}
              className={`rounded-xl border p-5 transition-all ${
                isDegraded
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : isWarning
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {/* Top info */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">{res.name}</h3>
                  <span className="text-[11px] text-slate-400">{res.service} • {res.region}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isDegraded
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {res.health} ({res.healthScore}/100)
                </span>
              </div>

              {/* Signals */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs mb-4">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">CPU</span>
                  <span className={`font-bold ${res.currentCpu >= 75 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {res.currentCpu}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">P95 Latency</span>
                  <span className={`font-bold ${res.currentLatency >= 300 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {res.currentLatency}ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Error Rate</span>
                  <span className={`font-bold ${res.errorRate >= 1.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {res.errorRate}%
                  </span>
                </div>
              </div>

              {/* Reasons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Evaluation Reasons:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {res.healthReasons?.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {isHealthy ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{reason}</span>
                    </li>
                  )) || <li>Nominal operation</li>}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
