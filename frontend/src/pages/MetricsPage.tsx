import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function MetricsPage() {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [statusFieldName, setStatusFieldName] = useState<string>('');

  const { data: entities } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await axios.get('/api/entities/');
      return res.data;
    }
  });

  // Auto-select first entity
  useEffect(() => {
    if (entities?.length > 0 && !selectedEntityId) {
      setSelectedEntityId(entities[0].id);
    }
  }, [entities, selectedEntityId]);

  const selectedEntity = useMemo(() =>
    entities?.find((e: any) => e.id === selectedEntityId),
    [entities, selectedEntityId]
  );

  // Auto-select first select/status field
  useEffect(() => {
    if (selectedEntity && !statusFieldName) {
      const statusField = selectedEntity.fields?.find((f: any) =>
        f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
      ) || selectedEntity.fields?.find((f: any) => f.field_type === 'select');
      if (statusField) setStatusFieldName(statusField.name);
    }
  }, [selectedEntity, statusFieldName]);

  const { data: records } = useQuery({
    queryKey: ['records', selectedEntityId],
    queryFn: async () => {
      if (!selectedEntityId) return [];
      const res = await axios.get(`/api/entities/${selectedEntityId}/records`);
      return res.data;
    },
    enabled: !!selectedEntityId
  });

  const chartData = useMemo(() => {
    if (!records || !statusFieldName) return [];
    const counts: Record<string, number> = {};
    const options = selectedEntity?.fields?.find((f: any) => f.name === statusFieldName)?.configuration?.options || [];
    options.forEach((opt: string) => counts[opt] = 0);
    records.forEach((r: any) => {
      const val = r.data[statusFieldName];
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records, statusFieldName, selectedEntity]);

  const hasData = selectedEntityId && statusFieldName;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="text-indigo-400" />
          Analytics & Metrics
        </h1>
        <p className="text-slate-400 mt-1">
          {selectedEntity ? (
            <>Real-time insights for <span className="text-white font-bold">{selectedEntity.display_name}</span></>
          ) : (
            'Real-time data visualization and operational insights.'
          )}
        </p>
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar chart */}
          <div className="bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-400" />
              Status Distribution
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#f1f5f9' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart */}
          <div className="bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-indigo-400" />
              Composition (%)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-900/30">
              <Activity className="mb-4 opacity-50" />
              <p className="text-sm opacity-80 uppercase tracking-wider font-bold">Total Records</p>
              <h4 className="text-4xl font-black mt-1">{records?.length || 0}</h4>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
              <BarChart3 className="mb-4 text-indigo-400 opacity-50" />
              <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">Active Trackers</p>
              <h4 className="text-4xl font-black mt-1 text-white">{entities?.length || 0}</h4>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
              <PieChartIcon className="mb-4 text-indigo-400 opacity-50" />
              <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">Defined States</p>
              <h4 className="text-4xl font-black mt-1 text-white">{chartData.length}</h4>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 bg-slate-900/50">
          <BarChart3 size={64} className="mb-4 opacity-10" />
          <p className="text-xl font-medium">
            {selectedEntityId ? 'No status fields found to chart.' : 'Loading metrics...'}
          </p>
        </div>
      )}
    </div>
  );
}
