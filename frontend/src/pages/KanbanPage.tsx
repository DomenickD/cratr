import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { Layout as Trello } from 'lucide-react';
import { KanbanColumn } from '../components/KanbanColumn';
import { getStepAccess } from '../utils/stepAccess';

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

  // Auto-select status field
  useEffect(() => {
    if (selectedEntity && !statusFieldName) {
      const statusField = selectedEntity.fields.find((f: any) =>
        f.name.toLowerCase() === 'status' || f.display_name.toLowerCase() === 'status'
      ) || selectedEntity.fields.find((f: any) => f.field_type === 'select');
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

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (user?.permissions?.can_view_all_records) return records;
    return records.filter((r: any) => r.data.requestor === user?.username);
  }, [records, user]);

  const moveMutation = useMutation({
    mutationFn: async ({ recordId, newStatus }: { recordId: number, newStatus: string }) =>
      axios.put(`/api/entities/${selectedEntityId}/records/${recordId}`, {
        data: { [statusFieldName]: newStatus }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', selectedEntityId] });
    }
  });

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (!user?.permissions?.can_edit_all_records) {
      alert('You do not have permission to move records.');
      return;
    }
    // Block drop into read-only columns
    if (getStepAccess(user, over.id) === 'read') {
      alert('This step is read-only for your role.');
      return;
    }
    moveMutation.mutate({ recordId: active.id, newStatus: over.id });
  };

  const allColumns: string[] = selectedEntity?.fields?.find((f: any) => f.name === statusFieldName)?.configuration?.options || [];
  // Filter out steps the user has no access to; keep read-only ones (greyed)
  const columns = allColumns.filter((col) => getStepAccess(user, col) !== 'none');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trello className="text-indigo-400" />
          {selectedEntity?.display_name || 'Process'} Board
        </h1>
        <p className="text-slate-400 mt-1">
          {user?.permissions?.can_view_all_records
            ? 'Organization-wide perspective.'
            : 'Viewing your personal submissions.'}
        </p>
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
                readonly={getStepAccess(user, col) === 'read'}
              />
            ))}
          </DndContext>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-[2rem] text-slate-500">
            <Trello size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Loading board...</p>
          </div>
        )}
      </div>
    </div>
  );
}
