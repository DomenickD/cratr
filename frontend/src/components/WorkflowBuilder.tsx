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
import { Save, Plus, Settings2, X, Eye, EyeOff, ChevronUp, ChevronDown, AlignLeft } from 'lucide-react';
import axios from 'axios';

const StatusNode = ({ data, selected }: any) => {
  const visibleCount = data.fieldConfigs?.filter((f: any) => f.visible).length || 0;
  const totalCount = data.fieldConfigs?.length || 0;

  return (
    <div className={`bg-slate-800 border-2 rounded-xl p-4 shadow-lg min-w-[200px] transition-colors ${selected ? 'border-indigo-400 shadow-indigo-500/30' : 'border-slate-600 hover:border-indigo-500/50'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="font-bold text-white">{data.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-slate-400 font-bold">
          {visibleCount}/{totalCount} fields shown
        </div>
        {data.instructions && (
          <AlignLeft size={10} className="text-indigo-400" title="Has instructions" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
};

const nodeTypes = { status: StatusNode };

export default function WorkflowBuilder({ entity, onSave }: { entity: any; onSave: () => void }) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [saving, setSaving] = useState(false);

  // New Field Dialog state
  const [showNewFieldDialog, setShowNewFieldDialog] = useState(false);
  const [newFieldData, setNewFieldData] = useState({ name: '', display_name: '', field_type: 'text', is_required: false });
  const [creatingField, setCreatingField] = useState(false);

  useEffect(() => {
    if (entity?.workflow_config) {
      setNodes(entity.workflow_config.nodes || []);
      setEdges(entity.workflow_config.edges || []);
    }
  }, [entity]);

  // Keep selectedNode in sync with nodes state
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find((n) => n.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
    }
  }, [nodes]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  const buildFieldConfigs = (existingConfigs?: any[]) =>
    entity.fields.map((f: any) => {
      const existing = existingConfigs?.find((fc: any) => fc.field_id === f.id);
      return existing ?? {
        field_id: f.id,
        name: f.name,
        display_name: f.display_name,
        field_type: f.field_type,
        visible: true,
        required: f.is_required,
        order: 0,
      };
    });

  const addNode = (status: string) => {
    const existing = nodes.find((n) => n.data.label === status);
    if (existing) return;
    const newNode = {
      id: `node-${status}`,
      type: 'status',
      data: { label: status, fieldConfigs: buildFieldConfigs(), instructions: '' },
      position: { x: 250, y: nodes.length * 140 + 50 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const createNewStatus = async () => {
    if (!newStatusName.trim()) return;
    const statusField = entity?.fields?.find(
      (f: any) => f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
    );
    if (!statusField) {
      alert('No status field found on this entity.');
      return;
    }
    try {
      const newOptions = [...(statusField.configuration?.options || []), newStatusName.trim()];
      await axios.put(`/api/entities/${entity.id}/fields/${statusField.id}`, {
        configuration: { ...statusField.configuration, options: newOptions },
      });
      addNode(newStatusName.trim());
      setNewStatusName('');
      onSave();
    } catch {
      alert('Error adding new step');
    }
  };

  const createStepField = async () => {
    if (!newFieldData.name || !newFieldData.display_name) return;
    setCreatingField(true);
    try {
      const res = await axios.post(`/api/entities/${entity.id}/fields`, newFieldData);
      const updatedEntity = res.data;
      const newField = updatedEntity.fields[updatedEntity.fields.length - 1];

      setNodes((nds) => nds.map(node => {
        const isCurrent = node.id === selectedNode.id;
        const newFc = {
          field_id: newField.id,
          name: newField.name,
          display_name: newField.display_name,
          field_type: newField.field_type,
          visible: isCurrent,
          required: isCurrent ? newField.is_required : false,
          order: 0
        };
        return {
          ...node,
          data: {
            ...node.data,
            fieldConfigs: [...(node.data.fieldConfigs || []), newFc]
          }
        };
      }));

      setShowNewFieldDialog(false);
      setNewFieldData({ name: '', display_name: '', field_type: 'text', is_required: false });
      onSave(); 
    } catch {
      alert('Error creating step field');
    } finally {
      setCreatingField(false);
    }
  };

  const onNodeClick = (_: any, node: any) => setSelectedNode(node);
  const onPaneClick = () => setSelectedNode(null);

  const updateFieldConfig = (fieldId: number, key: string, value: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                fieldConfigs: node.data.fieldConfigs.map((fc: any) =>
                  fc.field_id === fieldId ? { ...fc, [key]: value } : fc
                ),
              },
            }
          : node
      )
    );
  };

  const moveField = (fieldId: number, direction: 'up' | 'down') => {
    const configs: any[] = [...(selectedNode.data.fieldConfigs || [])];
    const idx = configs.findIndex((fc) => fc.field_id === fieldId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= configs.length) return;
    [configs[idx], configs[swapIdx]] = [configs[swapIdx], configs[idx]];
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, fieldConfigs: configs } }
          : node
      )
    );
  };

  const updateInstructions = (instructions: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, instructions } }
          : node
      )
    );
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/entities/${entity.id}`, { workflow_config: { nodes, edges } });
      onSave();
    } catch {
      alert('Error saving workflow');
    } finally {
      setSaving(false);
    }
  };

  const statusField =
    entity?.fields?.find(
      (f: any) => f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
    ) ?? entity?.fields?.find((f: any) => f.field_type === 'select');
  const statusOptions: string[] = statusField?.configuration?.options || [];

  const visibleFields = selectedNode?.data?.fieldConfigs?.filter((fc: any) => fc.visible) ?? [];
  const hiddenFields = selectedNode?.data?.fieldConfigs?.filter((fc: any) => !fc.visible) ?? [];

  return (
    <div className="h-[700px] w-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative text-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#334155" />
        <Controls />

        {/* Save button */}
        <Panel position="top-right" className="bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-700">
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-bold disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Workflow'}
          </button>
        </Panel>

        {/* Left panel — step list */}
        <Panel position="top-left" className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 max-w-[210px]">
          <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Process Steps</h4>

          <div className="mb-4 flex flex-col gap-2">
            <input
              type="text"
              placeholder="New step name…"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createNewStatus()}
              className="text-xs p-2 border border-slate-600 rounded bg-slate-700 text-white outline-none focus:border-indigo-500 font-bold"
            />
            <button
              onClick={createNewStatus}
              className="bg-indigo-600 text-white p-2 rounded text-[10px] font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={12} /> ADD STEP
            </button>
          </div>

          <hr className="mb-3 border-slate-700" />

          <div className="space-y-1.5">
            {statusOptions.map((opt: string) => {
              const onCanvas = nodes.some((n) => n.data.label === opt);
              return (
                <button
                  key={opt}
                  onClick={() => addNode(opt)}
                  disabled={onCanvas}
                  className="w-full text-left p-2 rounded-lg bg-slate-700 border border-slate-600 text-xs font-bold hover:bg-indigo-900/30 hover:border-indigo-700 disabled:opacity-40 flex items-center justify-between group"
                >
                  <span className="truncate">{opt}</span>
                  {onCanvas ? (
                    <span className="text-[9px] text-indigo-400 font-black">ON</span>
                  ) : (
                    <Plus size={11} className="opacity-0 group-hover:opacity-100 text-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>
        </Panel>
      </ReactFlow>

      {/* Right panel — step configuration */}
      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-800 border-l border-slate-700 shadow-2xl p-5 z-50 overflow-y-auto flex flex-col gap-5">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Settings2 size={18} className="text-indigo-400" />
              Step Configuration
            </h3>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Step badge */}
          <div className="p-4 bg-indigo-900/30 rounded-2xl border border-indigo-800">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Step Name</p>
            <p className="text-xl font-black text-indigo-300">{selectedNode.data.label}</p>
          </div>

          {/* Instructions */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Step Instructions
            </label>
            <textarea
              value={selectedNode.data.instructions || ''}
              onChange={(e) => updateInstructions(e.target.value)}
              placeholder="Guidance shown to users when filling out this step…"
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>

          {/* Visible fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Visible Fields <span className="text-indigo-400">({visibleFields.length})</span>
              </h4>
              <button onClick={() => setShowNewFieldDialog(true)} className="text-[9px] bg-indigo-900/40 text-indigo-400 px-2 py-1 rounded font-bold hover:bg-indigo-900/60 transition-colors">+ NEW FIELD</button>
            </div>
            <div className="space-y-2">
              {visibleFields.map((fc: any, i: number) => (
                <div key={fc.field_id} className="p-3 bg-slate-700 rounded-xl border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveField(fc.field_id, 'up')}
                          disabled={i === 0}
                          className="text-slate-500 hover:text-slate-300 disabled:opacity-20"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => moveField(fc.field_id, 'down')}
                          disabled={i === visibleFields.length - 1}
                          className="text-slate-500 hover:text-slate-300 disabled:opacity-20"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                      <span className="font-bold text-slate-100 text-sm truncate">{fc.display_name}</span>
                    </div>
                    <button
                      onClick={() => updateFieldConfig(fc.field_id, 'visible', false)}
                      className="text-indigo-400 hover:text-slate-400 flex-shrink-0"
                      title="Hide this field at this step"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fc.required}
                      onChange={(e) => updateFieldConfig(fc.field_id, 'required', e.target.checked)}
                      className="h-3 w-3 rounded border-slate-500 text-indigo-600 accent-indigo-600"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Required at this step
                    </span>
                  </label>
                </div>
              ))}
              {visibleFields.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-2">No visible fields</p>
              )}
            </div>
          </div>

          {/* Hidden fields */}
          {hiddenFields.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Hidden Fields <span className="text-slate-600">({hiddenFields.length})</span>
              </h4>
              <div className="space-y-1.5">
                {hiddenFields.map((fc: any) => (
                  <div
                    key={fc.field_id}
                    className="px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-700 flex items-center justify-between"
                  >
                    <span className="text-xs text-slate-500 font-bold">{fc.display_name}</span>
                    <button
                      onClick={() => updateFieldConfig(fc.field_id, 'visible', true)}
                      className="text-slate-600 hover:text-indigo-400"
                      title="Show this field at this step"
                    >
                      <EyeOff size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Field Dialog */}
      {showNewFieldDialog && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Add Step-Specific Field</h3>
              <button onClick={() => setShowNewFieldDialog(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-400 mb-4">This field will be created and made visible <strong>only</strong> on the current step ({selectedNode?.data?.label}).</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Name</label>
                <input type="text" value={newFieldData.name} onChange={e => setNewFieldData({...newFieldData, name: e.target.value})} placeholder="e.g. manager_notes" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Label</label>
                <input type="text" value={newFieldData.display_name} onChange={e => setNewFieldData({...newFieldData, display_name: e.target.value})} placeholder="e.g. Manager Notes" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Type</label>
                <select value={newFieldData.field_type} onChange={e => setNewFieldData({...newFieldData, field_type: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none">
                  <option value="text">Short Text</option>
                  <option value="textarea">Long Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Checkbox</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={newFieldData.is_required} onChange={e => setNewFieldData({...newFieldData, is_required: e.target.checked})} className="rounded border-slate-500 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required at this step</span>
              </label>
            </div>
            <button onClick={createStepField} disabled={creatingField} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg mt-4 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-900/20">
              {creatingField ? 'Creating...' : 'Create & Add to Step'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
