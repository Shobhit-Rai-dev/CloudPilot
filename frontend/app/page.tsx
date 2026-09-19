'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { DashboardSummary, Recommendation, MetricDataPoint, CloudResource } from '../types';
import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { ApprovalModal } from '../components/recommendations/ApprovalModal';
import { MetricChart } from '../components/charts/MetricChart';
import {
  Server,
  Activity,
  HeartPulse,
  DollarSign,
  TrendingUp,
  Cpu,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [metrics, setMetrics] = useState<MetricDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecForApproval, setSelectedRecForApproval] = useState<Recommendation | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sumData, recsData, resData, metricData] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getRecommendations().catch(() => []),
        api.getResources().catch(() => []),
        api.getResourceMetrics('production-api', '1h').catch(() => []),
      ]);

      if (sumData) setSummary(sumData);
      setRecommendations(recsData);
      setResources(resData);
      setMetrics(metricData);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Real-time WebSocket listener
  useWebSocket(
    useCallback(
      (event: any) => {
        if (
          event.event === 'TRAFFIC_SPIKE_TRIGGERED' ||
          event.event === 'RECOMMENDATION_EXECUTED' ||
          event.event === 'SIMULATION_RESET' ||
          event.event === 'METRICS_UPDATED'
        ) {
          fetchData();
        }
      },
      [fetchData]
    )
  );

  const handleApproveClick = (rec: Recommendation) => {
    setSelectedRecForApproval(rec);
  };

  const handleConfirmApproval = async (id: string) => {
    await api.approveRecommendation(id);
    await fetchData();
  };

  const handleReject = async (id: string) => {
    await api.rejectRecommendation(id);
    await fetchData();
  };

  const pendingRec = recommendations.find((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Operations Command Center</span>
            {summary?.isSimulationSpikeActive && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                SPIKE INJECTED
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure health, capacity scaling proposals, and budget enforcement
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Health */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Status</span>
            <div
              className={`p-2 rounded-lg ${
                summary?.health.state === 'HEALTHY'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
              }`}
            >
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{summary?.health.state || 'HEALTHY'}</div>
            <div className="text-xs text-slate-400 mt-1">
              Score: <strong className="text-slate-200">{summary?.health.score || 96}/100</strong>
              {summary?.health.degradedCount ? ` • ${summary.health.degradedCount} Degraded` : ' • Nominal'}
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cloud Resources</span>
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{summary?.resources.total || 5} Total</div>
            <div className="text-xs text-slate-400 mt-1">
              <strong className="text-emerald-400">{summary?.resources.running || 5}</strong> Running • ap-south-1
            </div>
          </div>
        </div>

        {/* Cost & Budget */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Spend</span>
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              ₹{summary?.cost.month.toLocaleString() || '18,000'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Budget: ₹{summary?.cost.budget.toLocaleString() || '30,000'} ({summary?.cost.utilizationPercent || 60}%)
            </div>
          </div>
        </div>

        {/* Production API Load */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Production Load</span>
            <div
              className={`p-2 rounded-lg ${
                (summary?.cpu.current || 45) > 75
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black ${
                (summary?.cpu.current || 45) > 75 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {summary?.cpu.current || 45}% CPU
            </div>
            <div className="text-xs text-slate-400 mt-1">
              P95 Latency: <strong className="text-slate-200">{summary?.latency.p95 || 180}ms</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Recommendation Banner when active */}
      {pendingRec && (
        <section className="animate-in slide-in-from-top duration-300">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Action Required — Scaling Recommendation</span>
            </h2>
          </div>
          <RecommendationCard
            recommendation={pendingRec}
            onApprove={handleApproveClick}
            onReject={handleReject}
          />
        </section>
      )}

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricChart
          data={metrics}
          metricKey="cpu"
          title="CPU Utilization (Production API)"
          unit="%"
          color={summary?.cpu.current && summary.cpu.current > 75 ? '#f43f5e' : '#38bdf8'}
        />
        <MetricChart
          data={metrics}
          metricKey="latency"
          title="P95 Latency Target vs Actual"
          unit="ms"
          color={summary?.latency.p95 && summary.latency.p95 > 300 ? '#fbbf24' : '#10b981'}
        />
      </div>

      {/* Services Health Breakdown Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Service Health Breakdown</h3>
          <span className="text-xs text-slate-400">{resources.length} active resources</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/40">
              <tr>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3">CPU</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Monthly Cost</th>
                <th className="py-2.5 px-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">
                    {res.name}
                    <span className="block text-[10px] text-slate-500 font-normal">{res.providerResourceId}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{res.type}</td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-200">{res.capacity} instances</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        res.currentCpu >= 75
                          ? 'text-rose-400'
                          : res.currentCpu >= 60
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {res.currentCpu}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{res.currentLatency}ms</td>
                  <td className="py-3 px-3 text-slate-300">₹{res.monthlyCost.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        res.health === 'HEALTHY'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : res.health === 'DEGRADED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {res.health}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        recommendation={selectedRecForApproval}
        isOpen={Boolean(selectedRecForApproval)}
        onClose={() => setSelectedRecForApproval(null)}
        onConfirm={handleConfirmApproval}
      />
    </div>
  );
}
