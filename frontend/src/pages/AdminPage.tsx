import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Table as TableIcon, List as ListIcon, GitBranch, Search, Edit3 } from 'lucide-react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import WorkflowBuilder from '../components/WorkflowBuilder';
import { useAuth } from '../hooks/useAuth';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const isEnterpriseAdmin = user?.role === 'enterprise_admin';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'entity' | 'workflow'>('entity');
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  const [entityName, setEntityName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fields, setFields] = useState<any[]>([]);

  const { data: entities } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await axios.get('/api/entities/', { headers: { 'X-Tenant-ID': 'public' } });
      return res.data;
    }
  });

  const selectedEntity = entities?.find((e: any) => e.id === selectedEntityId);

  // Org admins can't create models — auto-select first entity on load
  useEffect(() => {
    if (!isEnterpriseAdmin && entities?.length > 0 && !selectedEntityId) {
      loadEntityForEditing(entities[0]);
    }
  }, [entities, isEnterpriseAdmin, selectedEntityId]);

  const loadEntityForEditing = (entity: any) => {
    setSelectedEntityId(entity.id);
    setEntityName(entity.name);
    setDisplayName(entity.display_name);
    setFields(entity.fields);
    setActiveTab('entity');
  };

  const addField = () => {
    setFields([...fields, {
      name: '',
      display_name: '',
      field_type: 'text',
      is_required: false,
      configuration: { options: [] }
    }]);
  };

  const removeField = async (index: number) => {
    const field = fields[index];
    if (field.id && selectedEntityId) {
        if (!confirm('Are you sure you want to delete this field? Data in this field will be inaccessible.')) return;
        await axios.delete(`/api/entities/${selectedEntityId}/fields/${field.id}`, { headers: { 'X-Tenant-ID': 'public' } });
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const addOption = (fieldIndex: number) => {
    const newFields = [...fields];
    if (!newFields[fieldIndex].configuration) newFields[fieldIndex].configuration = { options: [] };
    if (!newFields[fieldIndex].configuration.options) newFields[fieldIndex].configuration.options = [];
    newFields[fieldIndex].configuration.options.push('');
    setFields(newFields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const newFields = [...fields];
    newFields[fieldIndex].configuration.options[optionIndex] = value;
    setFields(newFields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...fields];
    newFields[fieldIndex].configuration.options.splice(optionIndex, 1);
    setFields(newFields);
  };

  const saveEntity = async () => {
    try {
      const payload = {
        display_name: displayName,
      };

      if (selectedEntityId) {
          await axios.put(`/api/entities/${selectedEntityId}`, payload, { headers: { 'X-Tenant-ID': 'public' } });

          for (const field of fields) {
              if (field.id) {
                  await axios.put(`/api/entities/${selectedEntityId}/fields/${field.id}`, field, { headers: { 'X-Tenant-ID': 'public' } });
              } else {
                  await axios.post(`/api/entities/${selectedEntityId}/fields`, field, { headers: { 'X-Tenant-ID': 'public' } });
              }
          }
      } else {
          await axios.post('/api/entities/', { ...payload, name: entityName, fields }, { headers: { 'X-Tenant-ID': 'public' } });
      }

      alert('Configuration Saved Successfully!');
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      if (!selectedEntityId) {
          setEntityName('');
          setDisplayName('');
          setFields([]);
      }
    } catch (error) {
      console.error(error);
      alert('Error saving configuration');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-black text-white tracking-tight">System Studio</h1>
            <p className="text-slate-400 mt-1">Design your data models and visual workflows.</p>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 shadow-sm">
            <button
                onClick={() => setActiveTab('entity')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'entity' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <div className="flex items-center gap-2">
                    <TableIcon size={18} /> Model Builder
                </div>
            </button>
            <button
                disabled={!selectedEntityId}
                onClick={() => setActiveTab('workflow')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 ${activeTab === 'workflow' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <div className="flex items-center gap-2">
                    <GitBranch size={18} /> Workflow Canvas
                </div>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3 space-y-4">
            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 px-2 mb-4">
                    <Search size={16} className="text-slate-400" />
                    <input type="text" placeholder="Search models..." className="text-sm bg-transparent border-none focus:ring-0 w-full text-white placeholder-slate-500 outline-none" />
                </div>
                <div className="space-y-1">
                    {isEnterpriseAdmin && (
                      <>
                        <button
                            onClick={() => { setSelectedEntityId(null); setFields([]); setEntityName(''); setDisplayName(''); }}
                            className={`w-full text-left p-3 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all ${!selectedEntityId ? 'bg-indigo-900/40 text-indigo-400' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            <Plus size={18} /> Create New Model
                        </button>
                        <hr className="my-2 border-slate-700" />
                      </>
                    )}
                    {entities?.map((e: any) => (
                        <button
                            key={e.id}
                            onClick={() => loadEntityForEditing(e)}
                            className={`w-full text-left p-3 rounded-2xl text-sm font-bold flex items-center justify-between group transition-all ${selectedEntityId === e.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            <span className="truncate">{e.display_name}</span>
                            <Edit3 size={14} className={selectedEntityId === e.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="col-span-9">
            {activeTab === 'entity' ? (
                <div className="bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-700 space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-white">
                            {selectedEntityId ? `Editing: ${selectedEntity.display_name}` : 'Build New Data Model'}
                        </h2>
                        <button
                            onClick={saveEntity}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/30 transition-all active:scale-95"
                        >
                            <Save size={20} />
                            <span>Save Model</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Internal Reference</label>
                            <input
                                type="text"
                                value={entityName}
                                disabled={!!selectedEntityId}
                                onChange={(e) => setEntityName(e.target.value)}
                                placeholder="e.g. jicsaw_rfi"
                                className="w-full rounded-2xl border-slate-600 bg-slate-700 text-white p-4 font-bold disabled:opacity-50 border"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Display Label</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g. RFI Tracker"
                                className="w-full rounded-2xl border-slate-600 bg-slate-700 text-white p-4 font-bold border"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-lg font-bold text-white">Field Schema</h3>
                            <button
                                onClick={addField}
                                className="bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-600 flex items-center gap-2 border border-slate-600"
                            >
                                <Plus size={16} /> New Field
                            </button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, fieldIndex) => (
                                <div key={fieldIndex} className="p-6 bg-slate-900/50 rounded-[1.5rem] border border-slate-700 space-y-4 relative group">
                                    <div className="flex items-end gap-4">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Name</label>
                                            <input
                                                type="text"
                                                value={field.name}
                                                disabled={!!field.id}
                                                onChange={(e) => updateField(fieldIndex, 'name', e.target.value)}
                                                className="w-full rounded-xl border-slate-600 bg-slate-700 text-white p-2.5 text-sm font-bold border disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Label</label>
                                            <input
                                                type="text"
                                                value={field.display_name}
                                                onChange={(e) => updateField(fieldIndex, 'display_name', e.target.value)}
                                                className="w-full rounded-xl border-slate-600 bg-slate-700 text-white p-2.5 text-sm font-bold border"
                                            />
                                        </div>
                                        <div className="w-44 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Type</label>
                                            <select
                                                value={field.field_type}
                                                onChange={(e) => updateField(fieldIndex, 'field_type', e.target.value)}
                                                className="w-full rounded-xl border-slate-600 bg-slate-700 text-white p-2.5 text-sm font-bold border"
                                            >
                                                {FIELD_TYPES.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-44 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Value</label>
                                            <select
                                                value={field.default_value || ''}
                                                onChange={(e) => updateField(fieldIndex, 'default_value', e.target.value)}
                                                className="w-full rounded-xl border-slate-600 bg-slate-700 text-white p-2.5 text-sm font-bold border"
                                            >
                                                <option value="">None</option>
                                                <option value="@today">Today's Date</option>
                                                <option value="@user">Current User</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center h-[38px] px-2">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.is_required}
                                                    onChange={(e) => updateField(fieldIndex, 'is_required', e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Required</span>
                                            </label>
                                        </div>
                                        <button
                                            onClick={() => removeField(fieldIndex)}
                                            className="h-[38px] w-[38px] flex items-center justify-center text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-xl transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {field.field_type === 'select' && (
                                        <div className="ml-6 pl-6 border-l-2 border-indigo-700 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                    <ListIcon size={12} /> Dropdown Options
                                                </label>
                                                <button
                                                    onClick={() => addOption(fieldIndex)}
                                                    className="text-[10px] font-black bg-indigo-900/40 text-indigo-300 px-3 py-1 rounded-lg hover:bg-indigo-900/60 transition-colors"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {field.configuration?.options?.map((option: string, optionIndex: number) => (
                                                    <div key={optionIndex} className="flex items-center gap-2 bg-slate-700 p-1 rounded-xl border border-slate-600 shadow-sm">
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => updateOption(fieldIndex, optionIndex, e.target.value)}
                                                            className="flex-1 text-xs border-none focus:ring-0 font-bold p-1 bg-transparent text-white"
                                                            placeholder="New option..."
                                                        />
                                                        <button onClick={() => removeOption(fieldIndex, optionIndex)} className="p-1 text-slate-500 hover:text-red-400">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800 rounded-[2rem] shadow-sm border border-slate-700 overflow-hidden">
                    <WorkflowBuilder entity={selectedEntity} onSave={() => queryClient.invalidateQueries({ queryKey: ['entities'] })} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
