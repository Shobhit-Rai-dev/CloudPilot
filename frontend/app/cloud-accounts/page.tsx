'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CloudAccount } from '../../types';
import { CloudCog, CheckCircle2, Clock, ShieldCheck, KeyRound, ExternalLink } from 'lucide-react';

export default function CloudAccountsPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getCloudAccounts()
      .then((data) => setAccounts(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <CloudCog className="w-6 h-6 text-blue-400" />
          <span>Cloud Provider Accounts & Integrations</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Multi-cloud adapter connections: Amazon Web Services, Google Cloud Platform, and Microsoft Azure
        </p>
      </div>

      {/* Cloud Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AWS */}
        <div className="rounded-xl border border-blue-500/40 bg-slate-900/80 p-5 shadow-lg shadow-blue-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">Amazon Web Services</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              CONNECTED
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-mono text-slate-200">123456789012</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Default Region:</span>
              <span className="font-mono text-slate-200">ap-south-1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Integration:</span>
              <span className="text-emerald-400 font-semibold">EC2, ASG, CW, S3</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Active connection via official Boto3 adapter layer. Operating in local Mock Mode with live telemetry.
          </div>
        </div>

        {/* GCP */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 opacity-75">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">Google Cloud</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              COMING SOON
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-500">Project:</span>
              <span className="font-mono text-slate-400">cloudops-prod-gcp</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Region:</span>
              <span className="font-mono text-slate-400">asia-south1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Adapter:</span>
              <span className="text-slate-400">Compute Engine, GCS</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            Provider abstraction layer supports GCPProvider adapter extension.
          </div>
        </div>

        {/* Azure */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 opacity-75">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">Microsoft Azure</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              COMING SOON
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-500">Subscription:</span>
              <span className="font-mono text-slate-400">sub-987654321</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Region:</span>
              <span className="font-mono text-slate-400">centralindia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Adapter:</span>
              <span className="text-slate-400">Azure VMSS, Blob</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            Provider abstraction layer supports AzureProvider adapter extension.
          </div>
        </div>
      </div>
    </div>
  );
}
