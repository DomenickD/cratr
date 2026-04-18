import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ReactFlow, 
  Background, 
  Controls,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Activity, Info, ChevronRight, FileText } from 'lucide-react';

// --- Read-Only Node for Monitoring ---
const MonitorNode = ({ data }: any) => {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-[1.5rem] p-5 shadow-sm min-w-[200px] group hover:border-indigo-500 transition-colors">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex flex-col items-center">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{data.label}</div>
        <div className="text-4xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
            {data.count || 0}
        </div>
        <div className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">
            Active Records <ChevronRight size={10} />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = {
  status: MonitorNode,
};

export default function WorkflowsPage() {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  // 1. Fetch Entities
  const { data: entities } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await axios.get('/api/entities/', { headers: { 'X-Tenant-ID': 'public' } });
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

  const flowData = useMemo(() => {
    if (!selectedEntity?.workflow_config) return { nodes: [], edges: [] };
    
    const statusField = selectedEntity?.fields?.find((f: any) => 
        f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
    );

    const nodes = (selectedEntity.workflow_config.nodes || []).map((node: any) => {
        const count = (records || []).filter((r: any) => r.data[statusField?.name] === node.data.label).length;
        return {
            ...node,
            data: { ...node.data, count },
            draggable: false
        };
    });

    return { nodes, edges: selectedEntity.workflow_config.edges };
  }, [selectedEntity, records]);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <GitBranch className="text-indigo-600" />
            Workflow Lifecycle
          </h1>
          <p className="text-slate-500 mt-1">Real-time visualization of record distribution across organization stages.</p>
        </div>

        <select 
          className="rounded-xl border-slate-200 shadow-sm p-3 bg-white text-sm font-bold text-slate-700"
          onChange={(e) => setSelectedEntityId(Number(e.target.value))}
          value={selectedEntityId || ''}
        >
          <option value="">Select Process Tracker...</option>
          {entities?.map((e: any) => (
            <option key={e.id} value={e.id}>{e.display_name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden relative">
        {selectedEntityId && selectedEntity?.workflow_config ? (
            <div className="w-full h-full">
                <ReactFlow
                    nodes={flowData.nodes}
                    edges={flowData.edges}
                    nodeTypes={nodeTypes}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
                <div className="absolute top-6 left-6 flex gap-4">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                        <Activity size={18} className="text-indigo-400" />
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-50">Total Throughput</p>
                            <p className="text-lg font-black">{records?.length || 0} Records</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <GitBranch size={64} className="mb-4 opacity-10" />
             <p className="text-xl font-medium">Select an entity with a defined workflow to start monitoring</p>
             {!selectedEntity?.workflow_config && selectedEntityId && (
                 <div className="flex items-center gap-2 mt-4 text-sm bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-100 font-bold">
                    <Info size={14} />
                    <span>No workflow has been mapped for this entity in the Studio.</span>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
