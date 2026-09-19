'use client';

import React from 'react';
import { Recommendation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onApprove: (recommendation: Recommendation) => void;
  onReject: (id: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onApprove,
  onReject,
}) => {
  const { user, hasPermission } = useAuth();
  const canExecute = hasPermission('scaling.execute');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl shadow-amber-950/20">
      {/* Top Tag & Status */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Scaling Recommendation
            </span>
            <h3 className="text-base font-bold text-white leading-tight">
              {recommendation.resource} is under heavy load
            </h3>
          </div>
        </div>

        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
          {recommendation.status}
        </span>
      </div>

      {/* Sizing Comparison */}
      <div className="grid grid-cols-2 gap-4 my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Current Capacity
          </span>
          <span className="text-2xl font-black text-slate-200">
            {recommendation.currentCapacity} <span className="text-sm font-normal text-slate-400">instances</span>
          </span>
        </div>
        <div className="border-l border-slate-800 pl-4">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Recommended
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {recommendation.proposedCapacity} <span className="text-sm font-normal text-emerald-500/80">instances</span>
          </span>
        </div>
      </div>

      {/* Transparent Reasons */}
      <div className="mb-4 space-y-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Diagnostic Reasons:
        </span>
        <ul className="space-y-1 text-xs text-slate-300">
          {recommendation.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Financial & Gatekeeper Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs mb-5">
        <div>
          <span className="text-slate-400 block text-[11px]">Estimated Additional Cost</span>
          <span className="font-bold text-amber-400 text-sm">
            +{recommendation.cost.currencySymbol}
            {recommendation.cost.difference.toLocaleString()}/month
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Projected Budget</span>
          <span className="font-semibold text-slate-200 text-sm">
            {recommendation.cost.currencySymbol}
            {recommendation.cost.proposedMonthly.toLocaleString()} / ₹30,000
          </span>
        </div>
      </div>

      {/* 4 Checks Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-5">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Policy: <strong className="text-emerald-400">Pass</strong></span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Budget: <strong className="text-emerald-400">Pass</strong></span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Safety: <strong className="text-emerald-400">Pass</strong></span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          {canExecute ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">RBAC: <strong className="text-emerald-400">Pass</strong></span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-300">RBAC: <strong className="text-rose-400">Denied</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
        <button
          onClick={() => onReject(recommendation.id)}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Reject
        </button>

        <button
          onClick={() => onApprove(recommendation)}
          disabled={!canExecute}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
            canExecute
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
          title={canExecute ? 'Review and execute scaling' : 'Disabled: Current role lacks scaling.execute permission'}
        >
          {!canExecute && <Lock className="w-3.5 h-3.5" />}
          <span>{canExecute ? 'Review & Approve' : 'Approve (Viewer Restricted)'}</span>
        </button>
      </div>
    </div>
  );
};
