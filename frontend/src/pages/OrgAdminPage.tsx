import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { buildAllowedSteps, StepAccessLevel } from '../utils/stepAccess';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  Building2,
  UserCheck,
  UserX,
  Edit3,
  GitBranch,
  Eye,
  Pencil,
  EyeOff,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERMISSION_GROUPS = [
  {
    label: 'Administration',
    color: 'text-amber-400',
    borderClass: '',
    perms: [
      { key: 'can_manage_entities', label: 'Models' },
      { key: 'can_manage_workflows', label: 'Workflows' },
      { key: 'can_manage_users', label: 'Users' },
      { key: 'can_manage_roles', label: 'Roles' },
    ],
  },
  {
    label: 'Records',
    color: 'text-indigo-400',
    borderClass: 'border-l border-slate-700/50',
    perms: [
      { key: 'can_create_records', label: 'Create' },
      { key: 'can_view_all_records', label: 'View All' },
      { key: 'can_edit_all_records', label: 'Edit All' },
      { key: 'can_delete_records', label: 'Delete' },
    ],
  },
];

const ALL_PERMS = PERMISSION_GROUPS.flatMap((g) => g.perms);

const DEFAULT_ROLE = {
  name: '',
  can_manage_entities: false,
  can_manage_workflows: false,
  can_manage_users: false,
  can_manage_roles: false,
  can_create_records: true,
  can_view_all_records: false,
  can_edit_all_records: false,
  can_delete_records: false,
  allowed_steps: null as string[] | null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

/** Extract unique step labels from all entity workflow configs */
function extractSteps(entities: any[]): string[] {
  const seen = new Set<string>();
  const steps: string[] = [];
  for (const e of entities ?? []) {
    for (const node of e.workflow_config?.nodes ?? []) {
      const label: string = node.data?.label;
      if (label && !seen.has(label)) { seen.add(label); steps.push(label); }
    }
  }
  return steps;
}

/** Resolve the access level for a specific step from role.allowed_steps */
function getRoleStepAccess(role: any, step: string): StepAccessLevel {
  if (!role.allowed_steps) return 'write'; // null = unrestricted
  return (role.allowed_steps[step] as StepAccessLevel) ?? 'none';
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

function AddUserModal({
  roles,
  orgHeaders,
  onClose,
  onCreated,
}: {
  roles: any[];
  orgHeaders: Record<string, string>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role_id: roles[0]?.id ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.username || !form.email) { setError('Username and email are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await axios.post('/api/org/users', { ...form, role_id: form.role_id || undefined }, { headers: orgHeaders });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-md p-8 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">Add Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm p-3 rounded-xl">{error}</div>}

        {[
          { key: 'username', label: 'Username', type: 'text' },
          { key: 'full_name', label: 'Full Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'password', label: 'Temporary Password', type: 'password' },
        ].map(({ key, label, type }) => (
          <div key={key} className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            <input
              type={type}
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={key === 'password' ? 'changeme123 (default)' : ''}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
          <select
            value={form.role_id}
            onChange={(e) => setForm({ ...form, role_id: e.target.value as any })}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">No role</option>
            {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm hover:bg-slate-700">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Permission Cell ──────────────────────────────────────────────────────────

function PermCell({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
        on ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30' : 'bg-slate-700 text-slate-600 hover:bg-slate-600 border border-slate-600'
      } disabled:opacity-40`}
    >
      {on && <Check size={13} strokeWidth={3} />}
    </button>
  );
}

/** 3-state step cell: none → read → write, cycles on click */
function StepCell({ access, disabled, onClick }: { access: StepAccessLevel; disabled?: boolean; onClick: () => void }) {
  const styles: Record<StepAccessLevel, string> = {
    none: 'bg-slate-700 border border-slate-600 text-slate-600 hover:bg-slate-600',
    read: 'bg-amber-700/80 text-amber-200 shadow-sm shadow-amber-600/20 hover:bg-amber-700',
    write: 'bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-600',
  };
  const icons: Record<StepAccessLevel, React.ReactNode> = {
    none: null,
    read: <Eye size={12} />,
    write: <Pencil size={12} />,
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={{ none: 'Hidden — click to grant Read', read: 'Read Only — click to grant Write', write: 'Write — click to remove' }[access]}
      className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${styles[access]} disabled:opacity-40`}
    >
      {icons[access]}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrgAdminPage() {
  const { user } = useAuth();
  const isEnterpriseAdmin = user?.role === 'enterprise_admin';

  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [savingRole, setSavingRole] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<typeof DEFAULT_ROLE | null>(null);
  const [editingRoleName, setEditingRoleName] = useState<number | null>(null);

  const orgHeaders: Record<string, string> =
    isEnterpriseAdmin && selectedOrg ? { 'X-Tenant-ID': selectedOrg.schema_name } : {};

  const showContent = !isEnterpriseAdmin || !!selectedOrg;

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => axios.get('/api/auth/organizations').then((r) => r.data),
    enabled: isEnterpriseAdmin,
  });

  const { data: roles = [], refetch: refetchRoles } = useQuery({
    queryKey: ['org-roles', selectedOrg?.schema_name],
    queryFn: () => axios.get('/api/roles', { headers: orgHeaders }).then((r) => r.data),
    enabled: showContent,
  });

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['org-members', selectedOrg?.schema_name],
    queryFn: () => axios.get('/api/org/users', { headers: orgHeaders }).then((r) => r.data),
    enabled: showContent,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities-for-steps', selectedOrg?.schema_name],
    queryFn: () => axios.get('/api/entities/', { headers: orgHeaders }).then((r) => r.data),
    enabled: showContent,
  });

  const allSteps = extractSteps(entities);

  const refetchAll = () => { refetchRoles(); refetchMembers(); };

  // ── Role handlers ─────────────────────────────────────────────────────────

  const patchRole = async (roleId: number, patch: Record<string, any>) => {
    setSavingRole(roleId);
    try {
      await axios.put(`/api/roles/${roleId}`, patch, { headers: orgHeaders });
      refetchRoles();
    } finally {
      setSavingRole(null);
    }
  };

  const togglePerm = (role: any, permKey: string) =>
    patchRole(role.id, { [permKey]: !role[permKey] });

  const toggleStepAccess = (role: any, step: string) => {
    const next = buildAllowedSteps(role, step, allSteps);
    patchRole(role.id, { allowed_steps: next });
  };

  const resetToUnrestricted = (role: any) => {
    patchRole(role.id, { allowed_steps: null });
  };

  const saveRoleName = async (roleId: number, name: string) => {
    if (!name.trim()) return;
    await axios.put(`/api/roles/${roleId}`, { name: name.trim() }, { headers: orgHeaders });
    setEditingRoleName(null);
    refetchRoles();
  };

  const deleteRole = async (roleId: number) => {
    if (!confirm('Delete this role? Users assigned to it will lose their permissions.')) return;
    await axios.delete(`/api/roles/${roleId}`, { headers: orgHeaders });
    refetchRoles();
  };

  const createRole = async () => {
    if (!newRole?.name?.trim()) return;
    await axios.post('/api/roles', newRole, { headers: orgHeaders });
    setNewRole(null);
    refetchRoles();
  };

  // ── Member handlers ───────────────────────────────────────────────────────

  const updateMemberRole = async (userId: number, roleId: string) => {
    await axios.put(`/api/org/users/${userId}`, { role_id: roleId ? Number(roleId) : null }, { headers: orgHeaders });
    refetchMembers();
  };

  const toggleMemberActive = async (userId: number, isActive: boolean) => {
    await axios.put(`/api/org/users/${userId}`, { is_active: !isActive }, { headers: orgHeaders });
    refetchMembers();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Org Admin</h1>
          <p className="text-slate-400 mt-1">Manage members and configure role permissions for your organization.</p>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
          {(['members', 'roles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'members' ? <Users size={16} /> : <Shield size={16} />}
              {tab === 'members' ? 'Members' : 'Roles & Steps'}
            </button>
          ))}
        </div>
      </div>

      {/* Enterprise org selector */}
      {isEnterpriseAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-400 flex-shrink-0">
            <Building2 size={18} />
            <span className="text-sm font-bold">Viewing Organization:</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedOrg?.schema_name ?? ''}
              onChange={(e) => {
                const org = organizations?.find((o: any) => o.schema_name === e.target.value);
                setSelectedOrg(org ?? null);
              }}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-xl px-4 py-2.5 text-white text-sm font-bold appearance-none focus:outline-none focus:border-amber-500"
            >
              <option value="">Select an organization…</option>
              {organizations?.map((o: any) => (
                <option key={o.schema_name} value={o.schema_name}>{o.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
          </div>
        </div>
      )}

      {!showContent ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm font-bold">
          Select an organization above to manage its members and roles.
        </div>
      ) : activeTab === 'members' ? (

        /* ── Members Tab ─────────────────────────────────────────────────── */
        <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-black text-white">Organization Members</h2>
              <p className="text-slate-400 text-xs mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700"
            >
              <Plus size={16} /> Add Member
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Member', 'Username', 'Email', 'Role', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {members.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm font-bold">No members yet.</td></tr>
              )}
              {members.map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${m.is_active ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {initials(m.full_name || m.username)}
                      </div>
                      <span className="font-bold text-white text-sm">{m.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm font-mono">{m.username}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{m.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={m.role_id ?? ''}
                      onChange={(e) => updateMemberRole(m.id, e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">No role</option>
                      {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${m.is_active ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' : 'bg-slate-700 text-slate-500 border border-slate-600'}`}>
                      {m.is_active ? <><UserCheck size={10} /> Active</> : <><UserX size={10} /> Inactive</>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleMemberActive(m.id, m.is_active)}
                      className={`p-1.5 rounded-lg transition-colors ${m.is_active ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/20'}`}
                    >
                      {m.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        /* ── Roles & Steps Tab ───────────────────────────────────────────── */
        <div className="space-y-8">

          {/* Permission Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">Role Permission Grid</h2>
                <p className="text-slate-400 text-xs mt-0.5">Click any cell to toggle. Changes save instantly.</p>
              </div>
              <button
                onClick={() => setNewRole({ ...DEFAULT_ROLE })}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700"
              >
                <Plus size={16} /> New Role
              </button>
            </div>

            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-3 text-left" />
                    {PERMISSION_GROUPS.map((g) => (
                      <th
                        key={g.label}
                        colSpan={g.perms.length}
                        className={`px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest ${g.color} ${g.borderClass}`}
                      >
                        {g.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 w-12" />
                  </tr>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-44">Role Name</th>
                    {ALL_PERMS.map((p, i) => (
                      <th
                        key={p.key}
                        className={`px-3 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider ${i === PERMISSION_GROUPS[0].perms.length ? 'border-l border-slate-700/50' : ''}`}
                      >
                        {p.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 w-12" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700/40">
                  {roles.length === 0 && !newRole && (
                    <tr><td colSpan={ALL_PERMS.length + 2} className="text-center py-10 text-slate-500 text-sm font-bold">No roles yet.</td></tr>
                  )}

                  {roles.map((role: any) => (
                    <tr key={role.id} className={`hover:bg-slate-700/20 transition-colors ${savingRole === role.id ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        {editingRoleName === role.id ? (
                          <input
                            autoFocus
                            defaultValue={role.name}
                            onBlur={(e) => saveRoleName(role.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRoleName(role.id, (e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') setEditingRoleName(null);
                            }}
                            className="bg-slate-700 border border-indigo-500 rounded-lg px-2 py-1 text-sm text-white font-bold w-full focus:outline-none"
                          />
                        ) : (
                          <button onClick={() => setEditingRoleName(role.id)} className="flex items-center gap-1.5 group text-left">
                            <span className="font-bold text-white text-sm">{role.name}</span>
                            <Edit3 size={11} className="text-slate-600 group-hover:text-slate-300 opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                      </td>

                      {ALL_PERMS.map((p, i) => (
                        <td key={p.key} className={`px-3 py-4 text-center ${i === PERMISSION_GROUPS[0].perms.length ? 'border-l border-slate-700/50' : ''}`}>
                          <PermCell on={!!role[p.key]} disabled={savingRole === role.id} onClick={() => togglePerm(role, p.key)} />
                        </td>
                      ))}

                      <td className="px-3 py-4 text-center">
                        <button onClick={() => deleteRole(role.id)} className="text-slate-600 hover:text-red-400 hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* New role row */}
                  {newRole && (
                    <tr className="bg-indigo-900/20">
                      <td className="px-6 py-4">
                        <input
                          autoFocus
                          placeholder="Role name…"
                          value={newRole.name}
                          onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && createRole()}
                          className="bg-slate-700 border border-indigo-500 rounded-lg px-2 py-1 text-sm text-white font-bold w-full focus:outline-none placeholder-slate-500"
                        />
                      </td>
                      {ALL_PERMS.map((p, i) => (
                        <td key={p.key} className={`px-3 py-4 text-center ${i === PERMISSION_GROUPS[0].perms.length ? 'border-l border-slate-700/50' : ''}`}>
                          <PermCell on={!!(newRole as any)[p.key]} onClick={() => setNewRole({ ...newRole, [p.key]: !(newRole as any)[p.key] })} />
                        </td>
                      ))}
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-1 items-center">
                          <button onClick={createRole} className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-700">
                            <Check size={13} className="text-white" strokeWidth={3} />
                          </button>
                          <button onClick={() => setNewRole(null)} className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600">
                            <X size={13} className="text-slate-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 px-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center"><Check size={11} className="text-white" strokeWidth={3} /></div>
                <span>Granted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-700 rounded border border-slate-600" />
                <span>Denied</span>
              </div>
              <span>Click a cell to toggle · Click a role name to rename</span>
            </div>
          </div>

          {/* Workflow Step Access Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <GitBranch size={20} className="text-emerald-400" />
              <div>
                <h2 className="text-lg font-black text-white">Workflow Step Visibility</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Control which workflow steps each role can see. Unchecked steps are hidden from that role's view.
                </p>
              </div>
            </div>

            {allSteps.length === 0 ? (
              <div className="bg-slate-800 rounded-3xl border border-slate-700 p-10 text-center text-slate-500 text-sm font-bold">
                No workflow steps defined yet. Build a workflow in the Studio first.
              </div>
            ) : (
              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-44">Role</th>
                      {allSteps.map((step) => (
                        <th key={step} className="px-3 py-4 text-center text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                          {step}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-wider">Reset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {roles.length === 0 && (
                      <tr><td colSpan={allSteps.length + 2} className="text-center py-8 text-slate-500 text-sm font-bold">Create roles above first.</td></tr>
                    )}
                    {roles.map((role: any) => {
                      const isUnrestricted = !role.allowed_steps;
                      const writeCount = allSteps.filter((s) => getRoleStepAccess(role, s) === 'write').length;
                      const readCount = allSteps.filter((s) => getRoleStepAccess(role, s) === 'read').length;
                      return (
                        <tr key={role.id} className={`hover:bg-slate-700/20 transition-colors ${savingRole === role.id ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-white text-sm">{role.name}</span>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {isUnrestricted ? (
                                  <span className="text-[9px] font-black text-emerald-500 bg-emerald-900/30 px-1.5 py-0.5 rounded uppercase tracking-wide">All Write</span>
                                ) : (
                                  <>
                                    {writeCount > 0 && <span className="text-[9px] font-black text-emerald-500 bg-emerald-900/30 px-1.5 py-0.5 rounded">{writeCount}W</span>}
                                    {readCount > 0 && <span className="text-[9px] font-black text-amber-500 bg-amber-900/30 px-1.5 py-0.5 rounded">{readCount}R</span>}
                                    {(allSteps.length - writeCount - readCount) > 0 && (
                                      <span className="text-[9px] font-black text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">{allSteps.length - writeCount - readCount}H</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          {allSteps.map((step) => (
                            <td key={step} className="px-3 py-4 text-center">
                              <StepCell
                                access={getRoleStepAccess(role, step)}
                                disabled={savingRole === role.id}
                                onClick={() => toggleStepAccess(role, step)}
                              />
                            </td>
                          ))}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => resetToUnrestricted(role)}
                              disabled={savingRole === role.id || isUnrestricted}
                              title="Reset to full write access on all steps"
                              className="text-[10px] font-black px-2 py-1 rounded-lg transition-colors bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center gap-5 text-xs text-slate-500 px-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-slate-700 rounded border border-slate-600" />
                <span>Hidden (no access)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-amber-700/80 rounded flex items-center justify-center"><Eye size={11} className="text-amber-200" /></div>
                <span>Read Only (visible, greyed out)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-emerald-700 rounded flex items-center justify-center"><Pencil size={11} className="text-white" /></div>
                <span>Write (full access)</span>
              </div>
              <span className="text-slate-600">· Click a cell to cycle · W = write steps, R = read-only, H = hidden</span>
            </div>
          </div>
        </div>
      )}

      {showAddUser && (
        <AddUserModal roles={roles} orgHeaders={orgHeaders} onClose={() => setShowAddUser(false)} onCreated={refetchAll} />
      )}
    </div>
  );
}
