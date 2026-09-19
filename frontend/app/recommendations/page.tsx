'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Recommendation } from '../../types';
import { RecommendationCard } from '../../components/recommendations/RecommendationCard';
import { ApprovalModal } from '../../components/recommendations/ApprovalModal';
import { Sparkles, CheckCircle2, History, RefreshCw } from 'lucide-react';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRecommendations = useCallback(() => {
    api
      .getRecommendations()
      .then((data) => setRecommendations(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleApprove = (rec: Recommendation) => {
    setSelectedRec(rec);
  };

  const handleConfirmExecute = async (id: string) => {
    await api.approveRecommendation(id);
    fetchRecommendations();
  };

  const handleReject = async (id: string) => {
    await api.rejectRecommendation(id);
    fetchRecommendations();
  };

  const pendingRecs = recommendations.filter((r) => r.status === 'PENDING');
  const historicalRecs = recommendations.filter((r) => r.status !== 'PENDING');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>Intelligent Scaling & Optimization Proposals</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explainable automated recommendations subjected to Policy, Budget, Permission, and Safety checks
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Active Pending Proposals */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>Pending Approvals ({pendingRecs.length})</span>
        </h2>

        {pendingRecs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold">No pending recommendations</p>
            <p className="text-slate-500 mt-1">
              All services are operating within normal baseline parameters. Trigger a simulation spike to test the scaling pipeline.
            </p>
          </div>
        ) : (
          pendingRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>

      {/* Historical Proposals */}
      {historicalRecs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Execution History ({historicalRecs.length})</span>
          </h2>

          <div className="space-y-3">
            {historicalRecs.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{rec.resource}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                  <span className="text-slate-400 mt-1 block">
                    Scaled from {rec.currentCapacity} to {rec.proposedCapacity} instances • Cost:{' '}
                    {rec.cost.currencySymbol}
                    {rec.cost.proposedMonthly.toLocaleString()}/mo
                  </span>
                </div>
                <div className="text-right text-slate-500 text-[11px]">
                  {rec.createdAt ? new Date(rec.createdAt).toLocaleTimeString() : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        recommendation={selectedRec}
        isOpen={Boolean(selectedRec)}
        onClose={() => setSelectedRec(null)}
        onConfirm={handleConfirmExecute}
      />
    </div>
  );
}
