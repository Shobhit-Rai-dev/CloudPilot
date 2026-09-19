'use client';

import React, { useState } from 'react';
import { Recommendation } from '../../types';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Server,
  DollarSign,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface ApprovalModalProps {
  recommendation: Recommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  recommendation,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !recommendation) return null;

  const handleExecute = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirm(recommendation.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Review Infrastructure Change</h2>
              <p className="text-xs text-slate-400">Policy-governed & budget-verified operational action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Change Sizing Grid */}
        <div className="my-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>TARGET RESOURCE</span>
            <span className="font-semibold text-white">{recommendation.resource}</span>
          </div>

          <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-slate-900 border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Current Capacity</span>
              <span className="text-xl font-bold text-white">{recommendation.currentCapacity} instances</span>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-400" />
            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Proposed Capacity</span>
              <span className="text-xl font-bold text-emerald-400">{recommendation.proposedCapacity} instances</span>
            </div>
          </div>
        </div>

        {/* Checks & Impact Summary */}
        <div className="space-y-3 text-xs mb-5">
          {/* Estimated Cost */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-400">Estimated Cost Impact:</span>
            <span className="font-bold text-amber-400">
              +{recommendation.cost.currencySymbol}
              {recommendation.cost.difference.toLocaleString()}/month
            </span>
          </div>

          {/* Budget Impact */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-400">Budget Allocation:</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {recommendation.cost.currencySymbol}
                {recommendation.cost.proposedMonthly.toLocaleString()} / ₹30,000 (Pass)
              </span>
            </span>
          </div>

          {/* Policy Result */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-400">Guardrail Policies:</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Allowed (ap-south-1 compliant, within bounds)</span>
            </span>
          </div>

          {/* Safety Result */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
            <span className="text-slate-400">Safety Limits:</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Within limit (+2 delta &lt; max 4)</span>
            </span>
          </div>
        </div>

        {/* Operational Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            This action will modify live cloud infrastructure through the Provider Adapter. Actual state will be verified upon completion and logged to the immutable audit trail.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing & Verifying...</span>
              </>
            ) : (
              <span>Confirm & Execute</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
