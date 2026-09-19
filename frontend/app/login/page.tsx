'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Cloud, Lock, User, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useAuth();
  const [email, setEmail] = useState('admin@cloudops.io');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = async (role: 'ADMIN' | 'DEVELOPER' | 'VIEWER') => {
    setIsLoading(true);
    await switchRole(role);
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-3">
            <Cloud className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">CloudOps Platform</h1>
          <p className="text-xs text-slate-400 mt-1">Multi-cloud control plane & scaling engine</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Email Address</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Login Presets */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-3">
            1-Click Demo Evaluation Presets
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickRole('ADMIN')}
              className="py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 text-[11px] font-semibold text-slate-300 hover:text-white transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickRole('DEVELOPER')}
              className="py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 text-[11px] font-semibold text-slate-300 hover:text-white transition-all"
            >
              DevOps
            </button>
            <button
              onClick={() => handleQuickRole('VIEWER')}
              className="py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500 text-[11px] font-semibold text-slate-300 hover:text-white transition-all"
            >
              Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
