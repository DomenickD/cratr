import { Link, Outlet } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  GitBranch, 
  Calendar as CalendarIcon, 
  Layout as Kanban, 
  BarChart3,
  LogOut,
  RefreshCcw,
  Building2
} from 'lucide-react';

const Sidebar = () => {
  const { user, organization, logout, login } = useAuth();
  
  const switchUser = async (role: string) => {
    try {
        const username = role.toLowerCase();
        const res = await axios.post(`/api/auth/login?username=${username}`);
        const { user: userData, organization: orgData, access_token } = res.data;
        login(userData, orgData, access_token);
    } catch (err) {
        alert('Failed to switch user. Ensure users are seeded.');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
    { icon: FileText, label: 'Forms', path: '/app/forms' },
    { icon: GitBranch, label: 'Workflows', path: '/app/workflows' },
    { icon: Kanban, label: 'Kanban', path: '/app/kanban' },
    { icon: CalendarIcon, label: 'Calendar', path: '/app/calendar' },
    { icon: BarChart3, label: 'Metrics', path: '/app/metrics' },
    { icon: Settings, label: 'Admin', path: '/app/admin' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-6 text-2xl font-black border-b border-slate-800 tracking-tighter">
        CRATR<span className="text-indigo-500">.</span>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm text-slate-400 hover:text-white"
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-xl border border-slate-700 mb-4 shadow-inner">
            <div className="flex items-center gap-2">
                <Building2 size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 truncate max-w-[100px]">
                    {organization?.name || 'Public'}
                </span>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors">
                <RefreshCcw size={12} />
            </button>
        </div>

        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-3 group relative">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-500/20 uppercase cursor-pointer">
                {user?.username?.[0] || 'A'}
            </div>
            
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl p-2 hidden group-hover:block shadow-2xl z-[60]">
                <p className="text-[10px] font-black text-slate-500 uppercase px-2 mb-2">Switch Identity</p>
                <button onClick={() => switchUser('Admin')} className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">Admin User</button>
                <button onClick={() => switchUser('Requestor')} className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">Requestor User</button>
                <button onClick={() => switchUser('Manager')} className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">Manager User</button>
            </div>

            <div className="text-sm">
                <p className="font-bold text-slate-100 truncate max-w-[100px]">{user?.full_name || user?.username || 'Admin'}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">System Access</p>
            </div>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
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
