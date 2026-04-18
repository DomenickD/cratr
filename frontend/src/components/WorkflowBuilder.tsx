import { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges,
  addEdge,
  Panel,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Plus, Settings2, X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

// --- Custom Node Component ---
const StatusNode = ({ data }: any) => {
  return (
    <div className="bg-white border-2 border-indigo-500 rounded-xl p-4 shadow-lg min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="font-bold text-slate-900">{data.label}</span>
      </div>
      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
        {data.fieldConfigs?.filter((f: any) => f.visible).length || 0} Visible Fields
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
};

const nodeTypes = {
  status: StatusNode,
};

export default function WorkflowBuilder({ entity, onSave }: { entity: any, onSave: () => void }) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [newStatusName, setNewStatusName] = useState('');

  // Initialize from entity config
  useEffect(() => {
    if (entity?.workflow_config) {
      setNodes(entity.workflow_config.nodes || []);
      setEdges(entity.workflow_config.edges || []);
    }
  }, [entity]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const addNode = (status: string) => {
    const newNode = {
      id: `node-${status}`,
      type: 'status',
      data: { 
        label: status,
        fieldConfigs: entity.fields.map((f: any) => ({
          field_id: f.id,
          name: f.name,
          display_name: f.display_name,
          visible: true,
          required: f.is_required
        }))
      },
      position: { x: 250, y: nodes.length * 100 + 50 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const createNewStatus = async () => {
    if (!newStatusName) return;
    
    try {
        const statusField = entity?.fields?.find((f: any) => 
            f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
        );

        if (!statusField) {
            alert('No status field found to add option to.');
            return;
        }

        const newOptions = [...(statusField.configuration?.options || []), newStatusName];
        
        await axios.put(`/api/entities/${entity.id}/fields/${statusField.id}`, {
            configuration: { ...statusField.configuration, options: newOptions }
        });

        addNode(newStatusName);
        setNewStatusName('');
        onSave(); // Refresh entity data
    } catch (error) {
        console.error(error);
        alert('Error adding new status option');
    }
  };

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
  };

  const updateFieldConfig = (fieldId: number, key: string, value: boolean) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              fieldConfigs: node.data.fieldConfigs.map((fc: any) =>
                fc.field_id === fieldId ? { ...fc, [key]: value } : fc
              ),
            },
          };
        }
        return node;
      })
    );
    setSelectedNode((prev: any) => ({
        ...prev,
        data: {
            ...prev.data,
            fieldConfigs: prev.data.fieldConfigs.map((fc: any) =>
                fc.field_id === fieldId ? { ...fc, [key]: value } : fc
            )
        }
    }));
  };

  const saveWorkflow = async () => {
    try {
      await axios.put(`/api/entities/${entity.id}`, {
        workflow_config: { nodes, edges }
      }, { headers: { 'X-Tenant-ID': 'public' } });
      alert('Workflow saved successfully!');
      onSave();
    } catch (error) {
      console.error(error);
      alert('Error saving workflow');
    }
  };

  const statusField = entity?.fields?.find((f: any) => 
    f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
  ) || entity?.fields?.find((f: any) => f.field_type === 'select');
  
  const statusOptions = statusField?.configuration?.options || [];

  return (
    <div className="h-[700px] w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative text-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="bg-white p-2 rounded-xl shadow-lg border border-slate-200 flex gap-2">
            <button 
                onClick={saveWorkflow}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-bold"
            >
                <Save size={16} /> Save Workflow
            </button>
        </Panel>
        
        <Panel position="top-left" className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 max-w-[200px]">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Process Steps</h4>
            
            <div className="mb-4 flex flex-col gap-2">
                <input 
                    type="text" 
                    placeholder="New step name..." 
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    className="text-[10px] p-2 border rounded bg-slate-50 outline-none focus:border-indigo-500 font-bold"
                />
                <button 
                    onClick={createNewStatus}
                    className="bg-slate-900 text-white p-2 rounded text-[10px] font-black hover:bg-slate-800 transition-colors"
                >
                    ADD NEW STEP
                </button>
            </div>

            <hr className="mb-4 border-slate-100" />

            <div className="space-y-2">
                {statusOptions.map((opt: string) => (
                    <button 
                        key={opt}
                        onClick={() => addNode(opt)}
                        disabled={nodes.some(n => n.data.label === opt)}
                        className="w-full text-left p-2 rounded bg-slate-50 border border-slate-100 text-xs font-bold hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 flex items-center justify-between group"
                    >
                        {opt}
                        <Plus size={12} className="opacity-0 group-hover:opacity-100" />
                    </button>
                ))}
            </div>
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-2xl p-6 z-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Settings2 size={20} className="text-indigo-600" />
                    Step Settings
                </h3>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs font-black text-indigo-400 uppercase mb-1">Current Step</p>
                <p className="text-xl font-black text-indigo-900">{selectedNode.data.label}</p>
            </div>

            <h4 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Field Permissions</h4>
            <div className="space-y-3">
                {selectedNode.data.fieldConfigs?.map((fc: any) => (
                    <div key={fc.field_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-700 text-sm">{fc.display_name}</span>
                            <button 
                                onClick={() => updateFieldConfig(fc.field_id, 'visible', !fc.visible)}
                                className={fc.visible ? 'text-indigo-600' : 'text-slate-300'}
                            >
                                {fc.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={fc.required}
                                onChange={(e) => updateFieldConfig(fc.field_id, 'required', e.target.checked)}
                                className="h-3 w-3 rounded border-slate-300 text-indigo-600"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Required at this step</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
