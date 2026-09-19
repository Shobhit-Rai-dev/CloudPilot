'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../services/api';
import { CloudResource, MetricDataPoint } from '../../../types';
import { MetricChart } from '../../../components/charts/MetricChart';
import {
  Server,
  ArrowLeft,
  Activity,
  DollarSign,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';

export default function ResourceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [resource, setResource] = useState<CloudResource | null>(null);
  const [metrics, setMetrics] = useState<MetricDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.getResource(id).catch(() => null),
        api.getResourceMetrics(id, timeRange).catch(() => []),
      ]).then(([resData, metricData]) => {
        setResource(resData);
        setMetrics(metricData);
        setIsLoading(false);
      });
    }
  }, [id, timeRange]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading resource specifications...</div>;
  }

  if (!resource) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Resource not found.</p>
        <Link href="/resources" className="text-blue-400 text-xs mt-2 inline-block">
          ← Back to resources
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Resources</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <span>{resource.name}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  resource.health === 'HEALTHY'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                }`}
              >
                {resource.health}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">{resource.providerResourceId} • {resource.region}</p>
          </div>

          <div className="flex items-center gap-2">
            {['1h', '6h', '24h', '7d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  timeRange === r
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hardware / Spec Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Capacity</span>
          <span className="text-xl font-bold text-white mt-1 block">{resource.capacity} instances</span>
          <span className="text-[11px] text-slate-500">Range: {resource.minCapacity} to {resource.maxCapacity} instances</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Current CPU</span>
          <span className="text-xl font-bold text-white mt-1 block">{resource.currentCpu}%</span>
          <span className="text-[11px] text-slate-500">Target baseline: 60%</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">P95 Latency</span>
          <span className="text-xl font-bold text-white mt-1 block">{resource.currentLatency} ms</span>
          <span className="text-[11px] text-slate-500">SLA ceiling: 300 ms</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Monthly Spend</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">₹{resource.monthlyCost.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500">Rate: ₹3,600/instance/mo</span>
        </div>
      </div>

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricChart
          data={metrics}
          metricKey="cpu"
          title="CPU Utilization History"
          unit="%"
          color={resource.currentCpu > 75 ? '#f43f5e' : '#38bdf8'}
        />
        <MetricChart
          data={metrics}
          metricKey="latency"
          title="Latency Distribution"
          unit="ms"
          color={resource.currentLatency > 300 ? '#fbbf24' : '#10b981'}
        />
      </div>

      {/* Health Reasons */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Health Diagnostics & Reasons</h3>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {resource.healthReasons?.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{r}</span>
            </li>
          )) || <li>All metrics nominal</li>}
        </ul>
      </div>
    </div>
  );
}
