"use client";

import { useEffect, useState } from "react";
import { Activity, Server, Zap } from "lucide-react";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, latency: 0, status: "loading" });

  useEffect(() => {
    // Poll the FastAPI backend every 3 seconds
    const fetchMetrics = async () => {
      try {
        const res = await fetch("http://localhost:8000/metrics");
        const data = await res.json();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6">CloudOps Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <Activity className="text-blue-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">CPU Usage</p>
            <p className="text-2xl font-bold">{metrics.cpu}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <Server className="text-green-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Memory</p>
            <p className="text-2xl font-bold">{metrics.memory}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <Zap className="text-yellow-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Latency</p>
            <p className="text-2xl font-bold">{metrics.latency} ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}