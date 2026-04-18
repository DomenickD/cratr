import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function MetricsPage() {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [statusFieldName, setStatusFieldName] = useState<string>('');

  // 1. Fetch Entities
  const { data: entities } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await axios.get('/api/entities/', { headers: { 'X-Tenant-ID': 'public' } });
      return res.data;
    }
  });

  const selectedEntity = useMemo(() => 
    entities?.find((e: any) => e.id === selectedEntityId), 
    [entities, selectedEntityId]
  );

  const statusFields = useMemo(() => 
    selectedEntity?.fields?.filter((f: any) => f.field_type === 'select') || [],
    [selectedEntity]
  );

  // 2. Fetch Records
  const { data: records } = useQuery({
    queryKey: ['records', selectedEntityId],
    queryFn: async () => {
      if (!selectedEntityId) return [];
      const res = await axios.get(`/api/entities/${selectedEntityId}/records`, { headers: { 'X-Tenant-ID': 'public' } });
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-indigo-600" />
            Analytics & Metrics
          </h1>
          <p className="text-slate-500 mt-1">Real-time data visualization and operational insights.</p>
        </div>

        <div className="flex gap-4">
          <select 
            className="rounded-lg border-slate-200 shadow-sm p-2 bg-white text-sm"
            onChange={(e) => {
                setSelectedEntityId(Number(e.target.value));
                setStatusFieldName('');
            }}
            value={selectedEntityId || ''}
          >
            <option value="">Select Entity...</option>
            {entities?.map((e: any) => (
              <option key={e.id} value={e.id}>{e.display_name}</option>
            ))}
          </select>

          {selectedEntityId && (
            <select 
              className="rounded-lg border-slate-200 shadow-sm p-2 bg-white text-sm"
              onChange={(e) => setStatusFieldName(e.target.value)}
              value={statusFieldName}
            >
              <option value="">Select Status Field...</option>
              {statusFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.display_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedEntityId && statusFieldName ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Distribution Bar Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                Status Distribution
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Percentage Pie Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <PieChartIcon size={20} className="text-indigo-600" />
                Composition (%)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
                <Activity className="mb-4 opacity-50" />
                <p className="text-sm opacity-80 uppercase tracking-wider font-bold">Total Records</p>
                <h4 className="text-4xl font-black mt-1">{records?.length || 0}</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <BarChart3 className="mb-4 text-indigo-600 opacity-50" />
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold">Active Trackers</p>
                <h4 className="text-4xl font-black mt-1 text-slate-900">{entities?.length || 0}</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <PieChartIcon className="mb-4 text-indigo-600 opacity-50" />
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold">Defined States</p>
                <h4 className="text-4xl font-black mt-1 text-slate-900">{chartData.length}</h4>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-slate-50">
             <BarChart3 size={64} className="mb-4 opacity-10" />
             <p className="text-xl font-medium">Select an entity and status field to generate report</p>
        </div>
      )}
    </div>
  );
}
