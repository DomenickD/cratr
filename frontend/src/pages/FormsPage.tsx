import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Send, FileJson, ClipboardList } from 'lucide-react';

export default function FormsPage() {
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: entities, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await axios.get('/api/entities/');
      return res.data;
    }
  });

  // Auto-select first entity
  useEffect(() => {
    if (entities?.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity]);

  // Apply field defaults whenever entity changes
  useEffect(() => {
    if (selectedEntity?.fields) {
      const defaults: Record<string, any> = {};
      selectedEntity.fields.forEach((field: any) => {
        if (field.default_value === '@today') {
          defaults[field.name] = new Date().toISOString().split('T')[0];
        } else if (field.default_value === '@user') {
          defaults[field.name] = 'Admin User';
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
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        if (selectedEntity?.fields) {
          const defaults: Record<string, any> = {};
          selectedEntity.fields.forEach((field: any) => {
            if (field.default_value === '@today') defaults[field.name] = new Date().toISOString().split('T')[0];
            else if (field.default_value === '@user') defaults[field.name] = 'Admin User';
            else if (field.default_value) defaults[field.name] = field.default_value;
          });
          setFormData(defaults);
        }
      }, 2000);
    } catch (error) {
      console.error(error);
      alert('Error saving record');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="w-6 h-6 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin mr-3" />
        Loading...
      </div>
    );
  }

  if (!selectedEntity) {
    return (
      <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-500">
        <FileJson size={48} className="mb-4 opacity-20" />
        <p className="text-lg">No forms available for your organization.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Submit a Request</h1>
              <p className="text-slate-400 text-sm">{selectedEntity.display_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-slate-800 rounded-[2rem] border border-slate-700 overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 border-b border-slate-700">
          <p className="text-slate-400 text-sm">
            Fill in all required fields and click <span className="text-white font-bold">Submit</span> to create a new record.
          </p>
        </div>

        <form onSubmit={submitForm} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedEntity.fields.map((field: any) => (
              <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  {field.display_name}
                  {field.is_required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {field.field_type === 'textarea' ? (
                  <textarea
                    required={field.is_required}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-700 text-white placeholder-slate-500 p-3 focus:border-indigo-500 outline-none transition-colors"
                    rows={4}
                  />
                ) : field.field_type === 'date' ? (
                  <input
                    type="date"
                    required={field.is_required}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-700 text-white p-3 focus:border-indigo-500 outline-none transition-colors"
                  />
                ) : field.field_type === 'boolean' ? (
                  <div className="flex items-center h-12">
                    <input
                      type="checkbox"
                      checked={formData[field.name] || false}
                      onChange={(e) => handleInputChange(field.name, e.target.checked)}
                      className="h-5 w-5 text-indigo-600 border-slate-500 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-slate-400">Yes / No</span>
                  </div>
                ) : field.field_type === 'select' ? (
                  <select
                    required={field.is_required}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-700 text-white p-3 focus:border-indigo-500 outline-none transition-colors"
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
                    className="block w-full rounded-xl border border-slate-600 bg-slate-700 text-white placeholder-slate-500 p-3 focus:border-indigo-500 outline-none transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
            <p className="text-slate-500 text-xs">
              <span className="text-red-400">*</span> Required fields
            </p>
            <button
              type="submit"
              disabled={submitted}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all active:scale-95 shadow-lg ${
                submitted
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
              }`}
            >
              {submitted ? (
                <>✓ Submitted!</>
              ) : (
                <><Send size={18} /> Submit Record</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
