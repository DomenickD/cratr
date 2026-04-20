import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Rocket,
  ShieldCheck,
  Database,
  GitBranch,
  ArrowRight,
  Building2,
  Crown,
  ChevronRight,
  Layers
} from 'lucide-react';

const DEMO_ROLES = [
  {
    username: 'enterprise_admin',
    label: 'Enterprise Admin',
    sublabel: 'Global system access',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    username: 'jicsaw_admin',
    label: 'JICSAW Admin',
    sublabel: 'JICSAW organization',
    icon: Building2,
    color: 'from-indigo-500 to-violet-600',
    border: 'border-indigo-500/30 hover:border-indigo-400/60',
    bg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    iconColor: 'text-indigo-400',
  },
  {
    username: 'puzzle_admin',
    label: 'PUZZLE Admin',
    sublabel: 'PUZZLE organization',
    icon: Layers,
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
];

const FEATURES = [
  { icon: Database, label: 'Schema-per-Tenant', desc: 'Total data isolation per organization' },
  { icon: GitBranch, label: 'Visual Workflows', desc: 'Map status lifecycles with a drag-and-drop canvas' },
  { icon: ShieldCheck, label: 'Role-Based Access', desc: 'Granular permissions at the field level' },
];

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [manualUsername, setManualUsername] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleLogin = async (username: string) => {
    setLoading(username);
    setError('');
    try {
      const res = await axios.post(`/api/auth/login?username=${username}`);
      const { user: userData, organization: orgData, access_token } = res.data;
      login(userData, orgData, access_token);
      navigate('/app');
    } catch {
      setError(`Login failed for "${username}". Run seed.py first.`);
    } finally {
      setLoading(null);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsername.trim()) return;
    await handleLogin(manualUsername.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-violet-900/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

        {/* ── Left: Branding ─────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between p-12 lg:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Rocket size={20} />
            </div>
            <span className="text-2xl font-black tracking-tighter">
              CRATR<span className="text-indigo-400">.</span>
            </span>
          </div>

          {/* Hero copy */}
          <div className="max-w-lg space-y-8 py-16">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-300 text-xs font-black uppercase tracking-widest">
              Enterprise Operations Platform
            </div>

            <h1 className="text-6xl xl:text-7xl font-black tracking-tight leading-[0.92]">
              Build dynamic<br />
              <span className="text-indigo-400">workflows</span><br />
              at scale.
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed">
              Schema-isolated multi-tenancy meets a no-code workflow engine.
              Design, track, and optimize your entire enterprise in one place.
            </p>

            {/* Feature bullets */}
            <div className="space-y-4 pt-2">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={15} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-sm">{label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">
            &copy; 2026 CRATR Enterprise Solutions
          </p>
        </div>

        {/* ── Right: Login panel ─────────────────────────── */}
        <div className="w-full lg:w-[480px] flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-sm space-y-6">

            {/* Demo access header */}
            <div>
              <h2 className="text-2xl font-black text-white">Quick Access</h2>
              <p className="text-slate-400 text-sm mt-1">Click a role to log in instantly with demo credentials.</p>
            </div>

            {/* Demo role buttons */}
            <div className="space-y-3">
              {DEMO_ROLES.map((role) => {
                const Icon = role.icon;
                const isLoading = loading === role.username;
                return (
                  <button
                    key={role.username}
                    onClick={() => handleLogin(role.username)}
                    disabled={loading !== null}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${role.bg} ${role.border} disabled:opacity-50 disabled:cursor-not-allowed group`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-white text-sm">{role.label}</p>
                      <p className="text-xs text-slate-400">{role.sublabel}</p>
                    </div>
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500 font-medium">or sign in manually</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Manual login */}
            <form onSubmit={handleManualLogin} className="space-y-3">
              <input
                type="text"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-indigo-500 outline-none font-bold transition-colors"
              />
              <button
                type="submit"
                disabled={loading !== null || !manualUsername.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading === manualUsername ? (
                  <div className="w-4 h-4 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Access Workspace <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {error && (
              <p className="text-red-400 text-xs text-center font-bold bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            {/* Register org link */}
            <p className="text-center text-slate-500 text-xs">
              New organization?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-400 font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
