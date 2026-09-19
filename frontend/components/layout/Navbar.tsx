'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Cloud,
  Zap,
  RotateCcw,
  Shield,
  User,
  ChevronDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  onSimulationTriggered?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSimulationTriggered }) => {
  const { user, switchRole, logout } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSimulateSpike = async () => {
    setIsSimulating(true);
    try {
      await api.triggerTrafficSpike();
      showToast('⚡ Simulated Traffic Spike: CPU jumped to 86%, P95 latency to 520ms. Recommendation generated!');
      if (onSimulationTriggered) onSimulationTriggered();
    } catch (err: any) {
      showToast(`Simulation Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSimulation = async () => {
    setIsResetting(true);
    try {
      await api.resetSimulation();
      showToast('↺ Simulation reset: Production API restored to 2 instances, nominal CPU (45%).');
      if (onSimulationTriggered) onSimulationTriggered();
    } catch (err: any) {
      showToast(`Reset Error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-slate-900 border border-cyan-500/50 text-cyan-200 px-4 py-3 rounded-lg shadow-xl shadow-cyan-950/50 text-sm animate-bounce">
          <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Mode Beacon */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">CloudOps</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Control Plane
                </span>
              </div>
            </Link>

            {/* Provider Mode Badge */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MOCK ENGINE ACTIVE (AWS READY)</span>
            </div>
          </div>

          {/* Center: Live Simulation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateSpike}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 hover:border-rose-500/60 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Simulate sudden traffic spike (+55%), CPU 86%, P95 520ms"
            >
              <Zap className={`w-3.5 h-3.5 text-rose-400 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Injecting Spike...' : 'Simulate Traffic Spike'}</span>
            </button>

            <button
              onClick={handleResetSimulation}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Reset simulation to nominal baseline"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Right: Quick Role Switcher (RBAC) & Profile */}
          <div className="flex items-center gap-3">
            {/* 1-Click Role Switcher */}
            <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <span className="px-2 text-slate-400">Role:</span>
              <button
                onClick={() => switchRole('ADMIN')}
                className={`px-2 py-1 rounded transition-colors ${
                  user?.role === 'ADMIN'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => switchRole('DEVELOPER')}
                className={`px-2 py-1 rounded transition-colors ${
                  user?.role === 'DEVELOPER'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dev
              </button>
              <button
                onClick={() => switchRole('VIEWER')}
                className={`px-2 py-1 rounded transition-colors ${
                  user?.role === 'VIEWER'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Viewer
              </button>
            </div>

            {/* Active User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-white">{user?.name || 'Admin'}</div>
                <div className="text-[10px] text-slate-400">{user?.role || 'ADMIN'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
