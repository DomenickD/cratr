import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ShieldCheck, Database, GitBranch, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Rocket size={18} />
                </div>
                CRATR<span className="text-indigo-600">.</span>
            </div>
            <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
                <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">Get Started</Link>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full text-indigo-600 text-xs font-black uppercase tracking-widest">
                    Next-Gen Enterprise OS
                </div>
                <h1 className="text-7xl font-black text-slate-900 tracking-tight leading-[0.95]">
                    Build dynamic <br />
                    <span className="text-indigo-600">workflows</span> at scale.
                </h1>
                <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
                    The only enterprise platform that combines schema-isolated multi-tenancy with a visual, no-code workflow engine. Design, track, and optimize your entire organization in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link to="/login" className="bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] text-lg font-black hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                        Start Building Now <ArrowRight size={20} />
                    </Link>
                    <button className="bg-white border border-slate-200 text-slate-700 px-10 py-5 rounded-[1.5rem] text-lg font-black hover:bg-slate-50 transition-all flex items-center justify-center">
                        Request Demo
                    </button>
                </div>
            </div>
            
            <div className="relative">
                <div className="bg-slate-900 rounded-[3rem] p-4 shadow-2xl transform lg:rotate-3 hover:rotate-0 transition-transform duration-700 overflow-hidden border-[8px] border-white">
                    <div className="bg-slate-800 rounded-[2rem] h-[500px] w-full p-8 flex flex-col gap-6 overflow-hidden">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-8 bg-slate-700 rounded-lg w-1/3" />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-40 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xs text-center p-2">NODE A</div>
                                <div className="h-40 bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 font-black tracking-widest text-xl">{'>>'}</div>
                                <div className="h-40 bg-violet-500/20 rounded-2xl border border-violet-500/30 flex items-center justify-center text-violet-400 font-black text-xs text-center p-2">NODE B</div>
                            </div>
                            <div className="h-32 bg-slate-700 rounded-2xl opacity-50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Everything you need to <span className="text-indigo-600 underline decoration-8 decoration-indigo-100">operate</span>.</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Built from the ground up for teams that demand total isolation without sacrificing flexibility.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-900">
            {[
                { title: 'Schema-per-Tenant', desc: 'Maximum data isolation with dedicated PostgreSQL schemas for every client.' },
                { title: 'Visual Workflow Builder', desc: 'Map your status lifecycle visually and control field-level permissions.' },
                { title: 'Dynamic Analytics', desc: 'Real-time metrics and operational insights generated from your custom entities.' }
            ].map((f, i) => (
                <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                    <CheckCircle2 className="text-indigo-600 mb-6 group-hover:scale-110 transition-transform" size={32} />
                    <h3 className="text-xl font-black mb-4">{f.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}
