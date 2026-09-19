'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Policy } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, Lock, Save, AlertTriangle } from 'lucide-react';

export default function PoliciesPage() {
  const { hasPermission } = useAuth();
  const canModify = hasPermission('policy.modify');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getPolicies().then((data) => {
      setPolicies(data);
      if (data.length > 0) {
        setEditingPolicy(data[0]);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!editingPolicy) return;
    try {
      const updated = await api.updatePolicy(editingPolicy.id, {
        min_instances: editingPolicy.min_instances,
        max_instances: editingPolicy.max_instances,
        max_scale_delta: editingPolicy.max_scale_delta,
        allowed_regions: editingPolicy.allowed_regions,
        require_approval: editingPolicy.require_approval,
      });
      setStatusMsg('✓ Policy updated and enforced across control plane');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>Governance & Guardrail Policies</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Server-enforced infrastructure rules: capacity boundaries, region whitelists, and approval requirements
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {editingPolicy && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">{editingPolicy.name}</h2>
              <span className="text-[11px] text-slate-500">Applies to all production cloud resources</span>
            </div>
            {!canModify && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Read-Only (Requires Admin)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Minimum Instances Boundary</label>
              <input
                type="number"
                disabled={!canModify}
                value={editingPolicy.min_instances}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, min_instances: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Baseline high-availability minimum</span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Maximum Instances Ceiling</label>
              <input
                type="number"
                disabled={!canModify}
                value={editingPolicy.max_instances}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, max_instances: parseInt(e.target.value) || 8 })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Hard ceiling to avoid runaway costs</span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Scale Delta per Action</label>
              <input
                type="number"
                disabled={!canModify}
                value={editingPolicy.max_scale_delta}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, max_scale_delta: parseInt(e.target.value) || 4 })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Max jump allowed in a single scaling step</span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Allowed Geographic Regions</label>
              <input
                type="text"
                disabled={!canModify}
                value={editingPolicy.allowed_regions}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, allowed_regions: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Comma-separated region whitelist</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="req_app"
                disabled={!canModify}
                checked={editingPolicy.require_approval}
                onChange={(e) =>
                  setEditingPolicy({ ...editingPolicy, require_approval: e.target.checked })
                }
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
              />
              <label htmlFor="req_app" className="text-xs text-slate-300">
                Require Explicit Human-in-the-Loop Operator Approval
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={!canModify}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Policy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
