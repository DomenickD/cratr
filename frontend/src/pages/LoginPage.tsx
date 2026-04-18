import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Database, ShieldCheck, Rocket, Building2, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [orgName, setOrgName] = useState('');
  const [schema, setSchema] = useState('');

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await axios.get('/api/auth/organizations');
      return res.data;
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`/api/auth/login?username=${username}`);
      const { user: userData, organization: orgData, access_token } = res.data;
      
      // If user has no org, we can't really proceed to the app
      if (!orgData) {
          alert('User has no assigned organization.');
          return;
      }

      login(userData, orgData, access_token);
      navigate('/app');
    } catch (err) {
      alert('Login failed. Ensure user exists.');
    }
  };

  const handleRegisterOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register-org', { name: orgName, schema_name: schema });
      alert('Organization registered! You can now login.');
      setIsRegistering(false);
    } catch (err) {
      alert('Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-white">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/20 blur-[120px] rounded-full" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 mb-6 shadow-2xl shadow-indigo-500/50">
                <Rocket size={40} />
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-3">CRATR</h1>
            <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Enterprise OS Platform</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
          {isRegistering ? (
            <form onSubmit={handleRegisterOrg} className="space-y-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <Building2 className="text-indigo-400" /> Register Organization
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Org Name</label>
                        <input 
                            type="text" 
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 focus:border-indigo-500 transition-colors outline-none font-bold"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Schema Identifier</label>
                        <input 
                            type="text" 
                            required
                            value={schema}
                            onChange={(e) => setSchema(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 focus:border-indigo-500 transition-colors outline-none font-bold"
                            placeholder="e.g. acme_inc"
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                    <ShieldCheck size={20} /> Initialize Environment
                </button>
                <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-slate-500 font-bold text-sm hover:text-white transition-colors">
                    Back to Login
                </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <LogIn className="text-indigo-400" /> Security Access
                </h2>
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identification</label>
                    <input 
                        type="text" 
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 focus:border-indigo-500 transition-colors outline-none font-bold"
                        placeholder="Enter username..."
                    />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Database size={20} /> Access Workspace
                </button>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">New organization?</span>
                    <button type="button" onClick={() => setIsRegistering(true)} className="text-indigo-400 font-black text-sm flex items-center gap-1 hover:underline">
                        <UserPlus size={16} /> Register
                    </button>
                </div>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-8 font-medium">
            &copy; 2026 CRATR Enterprise Solutions. All systems active.
        </p>
      </div>
    </div>
  );
}
