import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LayoutDashboard,
  Settings,
  FileText,
  GitBranch,
  Calendar as CalendarIcon,
  Layout as Kanban,
  BarChart3,
  LogOut,
  Building2,
  Crown,
  Layers,
  ChevronRight,
  Terminal,
  Users,
} from 'lucide-react';

const Sidebar = () => {
  const { user, organization, logout, switchOrg } = useAuth();
  const location = useLocation();

  const isEnterpriseAdmin = user?.role === 'enterprise_admin';

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => axios.get('/api/auth/organizations').then(r => r.data),
    enabled: isEnterpriseAdmin
  });

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
    { icon: FileText, label: 'Submit Request', path: '/app/forms' },
    { icon: GitBranch, label: 'Workflows', path: '/app/workflows' },
    { icon: Kanban, label: 'Kanban', path: '/app/kanban' },
    { icon: CalendarIcon, label: 'Calendar', path: '/app/calendar' },
    { icon: BarChart3, label: 'Metrics', path: '/app/metrics' },
    { icon: Settings, label: 'Studio', path: '/app/admin' },
  ];

  const canAccessOrgAdmin =
    isEnterpriseAdmin ||
    user?.permissions?.can_manage_users ||
    user?.permissions?.can_manage_roles;

  const adminItems = canAccessOrgAdmin
    ? [{ icon: Users, label: 'Org Admin', path: '/app/org-admin' }]
    : [];

  const enterpriseItems = [
    { icon: Terminal, label: 'Dev Console', path: '/app/dev' },
  ];

  const isActive = (path: string) =>
    path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(path);

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col z-50 border-r border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-sm shadow shadow-indigo-500/30">
            C
          </div>
          CRATR<span className="text-indigo-400">.</span>
        </div>
      </div>

      {/* Org / Role badge */}
      <div className="px-4 pt-4">
        {isEnterpriseAdmin ? (
          <div className="flex flex-col gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Crown size={14} className="text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">Access Level</p>
                <p className="text-xs font-black text-amber-300 truncate">Enterprise Global</p>
              </div>
            </div>
            <select
              value={organization?.schema_name || ''}
              onChange={(e) => {
                const org = orgs?.find((o: any) => o.schema_name === e.target.value);
                if (org) {
                  switchOrg(org);
                  window.location.reload();
                }
              }}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-2 py-1 text-amber-300 text-[10px] font-black appearance-none focus:outline-none focus:border-amber-500 cursor-pointer mt-1"
            >
              <option value="">Select Organization...</option>
              {orgs?.map((o: any) => (
                <option key={o.schema_name} value={o.schema_name}>{o.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-800/50 border border-slate-700 rounded-xl">
            {organization?.name?.toUpperCase().includes('PUZZLE') ? (
              <Layers size={14} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <Building2 size={14} className="text-indigo-400 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Organization</p>
              <p className="text-xs font-black text-slate-200 truncate">{organization?.name || 'Public'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 mt-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 mb-2">Navigation</p>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center justify-between p-3 rounded-xl transition-all text-sm font-bold group ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
                {isActive(item.path) && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            </li>
          ))}
        </ul>

        {adminItems.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 mb-2">Admin</p>
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all text-sm font-bold group ${
                      isActive(item.path)
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {isActive(item.path) && <ChevronRight size={14} className="opacity-60" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isEnterpriseAdmin && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 px-3 mb-2">Enterprise</p>
            <ul className="space-y-1">
              {enterpriseItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all text-sm font-bold group ${
                      isActive(item.path)
                        ? 'bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10 border border-amber-500/20'
                        : 'text-amber-600/70 hover:bg-amber-500/10 hover:text-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {isActive(item.path) && <ChevronRight size={14} className="opacity-60" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase flex-shrink-0 ${
              isEnterpriseAdmin
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            }`}>
              {user?.username?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-100 text-sm truncate">
                {user?.full_name || user?.username || 'Admin'}
              </p>
              <p className={`text-[10px] font-black uppercase tracking-tighter ${
                isEnterpriseAdmin ? 'text-amber-400' : 'text-indigo-400'
              }`}>
                {isEnterpriseAdmin ? 'Enterprise Admin' : (user?.role || 'Org Admin')}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-slate-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="pl-64 p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RootLayout;
