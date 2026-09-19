'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MetricDataPoint } from '../../types';
import { MetricChart } from '../../components/charts/MetricChart';
import { Activity, Clock, RefreshCw } from 'lucide-react';

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MetricDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMetrics = () => {
    api
      .getResourceMetrics('production-api', timeRange)
      .then((data) => setMetrics(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>Infrastructure & Application Monitoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry streams: CPU, Memory, Latency, Throughput, and Error Rates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['1h', '6h', '24h', '7d'].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                timeRange === r
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
          <button
            onClick={fetchMetrics}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of 4 Core Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricChart
          data={metrics}
          metricKey="cpu"
          title="CPU Utilization"
          unit="%"
          color="#38bdf8"
        />

        <MetricChart
          data={metrics}
          metricKey="latency"
          title="P95 Latency (SLA Target: 300ms)"
          unit="ms"
          color="#fbbf24"
        />

        <MetricChart
          data={metrics}
          metricKey="traffic"
          title="Request Throughput"
          unit="req/min"
          color="#818cf8"
        />

        <MetricChart
          data={metrics}
          metricKey="errorRate"
          title="Error Rate"
          unit="%"
          color="#f43f5e"
        />
      </div>
    </div>
  );
}
