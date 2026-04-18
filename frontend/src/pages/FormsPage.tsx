import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Send, FileJson } from 'lucide-react';

export default function FormsPage() {
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // 1. Fetch all entity definitions
  const { data: entities, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await axios.get('/api/entities/', { headers: { 'X-Tenant-ID': 'public' } });
      return res.data;
    }
  });

  // Apply defaults when entity changes
  useEffect(() => {
    if (selectedEntity && selectedEntity.fields) {
      const defaults: Record<string, any> = {};
      selectedEntity.fields.forEach((field: any) => {
        if (field.default_value === '@today') {
          defaults[field.name] = new Date().toISOString().split('T')[0];
        } else if (field.default_value === '@user') {
          defaults[field.name] = 'Admin User'; // Mocking current user for now
        } else if (field.default_value) {
          defaults[field.name] = field.default_value;
        }
      });
      setFormData(defaults);
    }
  }, [selectedEntity]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;

    try {
      await axios.post(`/api/entities/${selectedEntity.id}/records`, {
        entity_definition_id: selectedEntity.id,
        data: formData
      }, { headers: { 'X-Tenant-ID': 'public' } });
      alert('Record saved successfully!');
      setFormData({});
    } catch (error) {
      console.error(error);
      alert('Error saving record');
    }
  };

  if (isLoading) return <div>Loading schemas...</div>;

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Sidebar: Entity Selection */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Available Trackers</h2>
        {entities?.map((entity: any) => (
          <button
            key={entity.id}
            onClick={() => {
              setSelectedEntity(entity);
              setFormData({});
            }}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedEntity?.id === entity.id 
                ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                : 'bg-white border-slate-200 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileJson className={selectedEntity?.id === entity.id ? 'text-indigo-600' : 'text-slate-400'} />
              <div>
                <p className="font-semibold text-slate-900">{entity.display_name}</p>
                <p className="text-xs text-slate-500 uppercase">{entity.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content: Dynamic Form */}
      <div className="col-span-9">
        {selectedEntity ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900">New {selectedEntity.display_name} Record</h1>
              <p className="text-slate-500">Enter information below to submit a new entry.</p>
            </div>
            
            <form onSubmit={submitForm} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {selectedEntity.fields.map((field: any) => (
                  <div key={field.id} className={field.field_type === 'textarea' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {field.display_name} {field.is_required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {field.field_type === 'textarea' ? (
                      <textarea
                        required={field.is_required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                        rows={4}
                      />
                    ) : field.field_type === 'date' ? (
                      <input
                        type="date"
                        required={field.is_required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                      />
                    ) : field.field_type === 'boolean' ? (
                      <div className="flex items-center h-12">
                        <input
                          type="checkbox"
                          checked={formData[field.name] || false}
                          onChange={(e) => handleInputChange(field.name, e.target.checked)}
                          className="h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-slate-600">Yes / No</span>
                      </div>
                    ) : field.field_type === 'select' ? (
                      <select
                        required={field.is_required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                      >
                        <option value="">Select an option...</option>
                        {field.configuration?.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.field_type === 'number' ? 'number' : 'text'}
                        required={field.is_required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Send size={18} />
                  Submit Record
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
            <FileJson size={48} className="mb-4 opacity-20" />
            <p className="text-lg">Select a tracker from the sidebar to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
