'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { CloudResource } from '../../types';
import {
  Server,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function ResourcesPage() {
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getResources()
      .then((data) => setResources(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = resources.filter((r) => {
    const matchesType = filterType === 'ALL' || r.type === filterType;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.providerResourceId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Server className="w-6 h-6 text-blue-400" />
            <span>Cloud Resources Inventory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Normalized compute, database, storage, and networking instances across providers
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search resource name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'COMPUTE', 'DATABASE', 'STORAGE', 'LOAD_BALANCER'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === t
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/60">
              <tr>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">CPU Load</th>
                <th className="py-3 px-4">Monthly Cost</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((res) => (
                <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span>{res.name}</span>
                    </div>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{res.providerResourceId}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[10px]">
                      {res.provider}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{res.type}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono">{res.region}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-bold">{res.capacity} instances</td>
                  <td className="py-3.5 px-4">
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
                  <td className="py-3.5 px-4 text-slate-200 font-medium">₹{res.monthlyCost.toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/resources/${res.id}`}
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
