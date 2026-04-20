import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Layout as Trello,
  Calendar,
  BarChart3,
  ShieldCheck,
  Database,
  ArrowRight
} from 'lucide-react';

const QuickAction = ({ to, icon: Icon, title, description, color }: any) => (
  <Link
    to={to}
    className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all group"
  >
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className="text-white" size={24} />
    </div>
    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
    <p className="text-slate-400 text-sm mb-4">{description}</p>
    <div className="flex items-center text-indigo-400 font-bold text-sm">
      Get Started <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

export default function Dashboard() {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-black text-white tracking-tight">
          Welcome back, <span className="text-indigo-400">Enterprise Admin</span>.
        </h1>
        <p className="text-xl text-slate-400 mt-4 leading-relaxed">
          Manage your organization's trackers, workflows, and analytics from a single, unified interface.
          Everything in Cratr is dynamic and built for scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction
          to="/forms"
          icon={PlusCircle}
          title="New Record"
          description="Submit data to any of your active trackers."
          color="bg-indigo-600"
        />
        <QuickAction
          to="/kanban"
          icon={Trello}
          title="Kanban Board"
          description="Track and move records across workflow stages."
          color="bg-violet-600"
        />
        <QuickAction
          to="/calendar"
          icon={Calendar}
          title="Calendar"
          description="View time-sensitive tasks and deadlines."
          color="bg-pink-600"
        />
        <QuickAction
          to="/metrics"
          icon={BarChart3}
          title="Analytics"
          description="Gain insights from your operational data."
          color="bg-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4">Powerful Multi-Tenancy</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    Cratr uses a dedicated schema-per-tenant architecture, ensuring total data isolation and security for every organization in your enterprise.
                </p>
                <div className="flex gap-4">
                    <div className="bg-slate-800 p-4 rounded-2xl flex items-center gap-3">
                        <ShieldCheck className="text-emerald-400" />
                        <span className="text-sm font-bold">Data Encrypted</span>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-2xl flex items-center gap-3">
                        <Database className="text-indigo-400" />
                        <span className="text-sm font-bold">Schema Isolated</span>
                    </div>
                </div>
            </div>
            <div className="absolute right-[-10%] bottom-[-20%] opacity-10">
                <Database size={400} />
            </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-8">
            <h3 className="text-xl font-bold text-white mb-6">System Status</h3>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">API Server</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Database</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Active Tenants</span>
                    <span className="text-white font-bold">12</span>
                </div>
                <hr className="border-slate-700" />
                <Link to="/admin" className="block text-center text-indigo-400 font-bold text-sm hover:underline">
                    Manage System Settings
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
