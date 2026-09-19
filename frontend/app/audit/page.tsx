'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { History, Shield, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = () => {
    api
      .getAuditLogs(100)
      .then((data) => setLogs(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-400" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident record of all operator actions, logins, policy changes, and automated scaling executions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Audit Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/60">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Old State</th>
                <th className="py-3 px-4">New State</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">{log.user_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.resource_name || '—'}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.old_state || '—'}</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono text-[11px]">{log.new_state || '—'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.result === 'SUCCESS'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {log.result === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{log.result}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={log.details}>
                    {log.details || '—'}
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
