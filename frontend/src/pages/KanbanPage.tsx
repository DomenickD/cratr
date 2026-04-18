import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { 
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Layout as Trello, Info } from 'lucide-react';
import { KanbanColumn } from '../components/KanbanColumn'; // Refactored for modularity

export default function KanbanPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [statusFieldName, setStatusFieldName] = useState<string>('');

  const { data: entities } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await axios.get('/api/entities/');
      return res.data;
    }
  });

  const selectedEntity = useMemo(() => 
    entities?.find((e: any) => e.id === selectedEntityId), 
    [entities, selectedEntityId]
  );

  useEffect(() => {
    if (selectedEntity) {
      const defaultStatus = selectedEntity.fields.find((f: any) => 
        f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
      );
      if (defaultStatus) setStatusFieldName(defaultStatus.name);
    }
  }, [selectedEntity]);

  const { data: records } = useQuery({
    queryKey: ['records', selectedEntityId],
    queryFn: async () => {
      if (!selectedEntityId) return [];
      const res = await axios.get(`/api/entities/${selectedEntityId}/records`);
      return res.data;
    },
    enabled: !!selectedEntityId
  });

  // Filter records based on role: Requestors only see their own
  const filteredRecords = useMemo(() => {
      if (!records) return [];
      if (user?.permissions?.can_view_all_records) return records;
      return records.filter((r: any) => r.data.requestor === user?.username);
  }, [records, user]);

  const moveMutation = useMutation({
    mutationFn: async ({ recordId, newStatus }: { recordId: number, newStatus: string }) => {
        return axios.put(`/api/entities/${selectedEntityId}/records/${recordId}`, {
            data: { [statusFieldName]: newStatus }
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['records', selectedEntityId] });
    }
  });

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    // Check permission to move
    if (!user?.permissions?.can_edit_all_records) {
        alert("You do not have permission to move records.");
        return;
    }

    const recordId = active.id;
    const newStatus = over.id;
    moveMutation.mutate({ recordId, newStatus });
  };

  const columns = selectedEntity?.fields?.find((f: any) => f.name === statusFieldName)?.configuration?.options || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trello className="text-indigo-600" />
            {selectedEntity?.display_name || 'Process'} Board
          </h1>
          <p className="text-slate-500 mt-1">
            {user?.permissions?.can_view_all_records ? 'Organization-wide perspective.' : 'Viewing your personal submissions.'}
          </p>
        </div>

        <select 
          className="rounded-xl border-slate-200 shadow-sm p-3 bg-white text-sm font-bold"
          onChange={(e) => setSelectedEntityId(Number(e.target.value))}
          value={selectedEntityId || ''}
        >
          <option value="">Select Tracker...</option>
          {entities?.map((e: any) => (
            <option key={e.id} value={e.id}>{e.display_name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 items-start h-[calc(100vh-250px)]">
        {selectedEntityId && statusFieldName ? (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            {columns.map((col: string) => (
              <KanbanColumn 
                key={col} 
                id={col} 
                title={col} 
                records={filteredRecords.filter((r: any) => r.data[statusFieldName] === col)} 
              />
            ))}
          </DndContext>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400">
             <Trello size={48} className="mb-4 opacity-20" />
             <p className="font-bold">Select a tracker to load the workflow board</p>
          </div>
        )}
      </div>
    </div>
  );
}
