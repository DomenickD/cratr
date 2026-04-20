import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, Building2, Crown, Search, SlidersHorizontal, Circle } from 'lucide-react';

const ROLE_META: Record<string, { label: string; color: string; dot: string }> = {
  enterprise_admin: { label: 'Enterprise Admin', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  org_admin:        { label: 'Org Admin',         color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400' },
  'Org Admin':      { label: 'Org Admin',         color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400' },
  viewer:           { label: 'Viewer',            color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', dot: 'bg-slate-500' },
};

const RoleBadge = ({ role }: { role: string }) => {
  const meta = ROLE_META[role] ?? { label: role, color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', dot: 'bg-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

export default function DevPage() {
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await axios.get('/api/auth/users');
      return res.data;
    }
  });

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await axios.get('/api/auth/organizations');
      return res.data;
    }
  });

  const uniqueRoles = useMemo(() => {
    if (!users) return [];
    return [...new Set(users.map((u: any) => u.role))];
  }, [users]);

  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter((u: any) => {
      const matchOrg = orgFilter === 'all'
        ? true
        : orgFilter === 'none'
          ? !u.organization_id
          : String(u.organization_id) === orgFilter;
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchSearch = !search.trim() || [u.username, u.full_name, u.email]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()));
      return matchOrg && matchRole && matchSearch;
    });
  }, [users, orgFilter, roleFilter, search]);

  const stats = useMemo(() => {
    if (!users) return { total: 0, enterprise: 0, orgAdmins: 0, orgs: 0 };
    return {
      total: users.length,
      enterprise: users.filter((u: any) => u.role === 'enterprise_admin').length,
      orgAdmins: users.filter((u: any) => u.role === 'org_admin' || u.role === 'Org Admin').length,
      orgs: orgs?.length ?? 0,
    };
  }, [users, orgs]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Crown size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Developer Console</h1>
            <p className="text-slate-400 text-sm">Enterprise-level user and organization visibility.</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',        value: stats.total,      icon: Users,     color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Enterprise Admins',  value: stats.enterprise, icon: Crown,     color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
          { label: 'Org Admins',         value: stats.orgAdmins,  icon: Users,     color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Organizations',      value: stats.orgs,       icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-5 ${bg}`}>
            <Icon size={18} className={`${color} mb-3`} />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-white text-sm outline-none w-full placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <Building2 size={15} className="text-slate-500" />
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            <option value="all">All Organizations</option>
            <option value="none">No Organization</option>
            {orgs?.map((o: any) => (
              <option key={o.id} value={String(o.id)}>{o.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <SlidersHorizontal size={15} className="text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map((r: any) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <span className="text-slate-500 text-xs font-bold ml-auto">
          {filtered.length} of {users?.length ?? 0} users
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-500 gap-3">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Users size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">No users match the current filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                {['User', 'Email', 'Role', 'Organization', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user: any, i: number) => (
                <tr
                  key={user.id}
                  className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase flex-shrink-0 ${
                        user.role === 'enterprise_admin' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        {user.username?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.full_name || user.username}</p>
                        <p className="text-slate-500 text-xs">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{user.email}</td>
                  <td className="px-5 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-4">
                    {user.organization_name ? (
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="text-slate-500" />
                        <div>
                          <p className="text-white font-bold">{user.organization_name}</p>
                          <p className="text-slate-500 text-xs font-mono">{user.organization_schema}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs italic">Global / No Org</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                      <Circle size={6} fill="currentColor" />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
