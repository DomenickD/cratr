import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [dateFieldName, setDateFieldName] = useState<string>('');

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

  // Auto-select first date field
  useEffect(() => {
    if (selectedEntity && !dateFieldName) {
      const dateField = selectedEntity.fields?.find((f: any) => f.field_type === 'date');
      if (dateField) setDateFieldName(dateField.name);
    }
  }, [selectedEntity, dateFieldName]);

  const { data: records } = useQuery({
    queryKey: ['records', selectedEntityId],
    queryFn: async () => {
      if (!selectedEntityId) return [];
      const res = await axios.get(`/api/entities/${selectedEntityId}/records`);
      return res.data;
    },
    enabled: !!selectedEntityId
  });

  const events = useMemo(() => {
    if (!records || !dateFieldName) return [];
    return records
      .filter((r: any) => r.data[dateFieldName])
      .map((r: any) => ({
        id: String(r.id),
        title: r.data.title || r.data.name || `Record #${r.id}`,
        start: r.data[dateFieldName],
        extendedProps: r.data
      }));
  }, [records, dateFieldName]);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CalendarIcon className="text-indigo-400" />
          Calendar View
        </h1>
        <p className="text-slate-400 mt-1">
          {selectedEntity ? (
            <>Visualizing <span className="text-white font-bold">{selectedEntity.display_name}</span> records by date.</>
          ) : (
            'Visualize time-sensitive records on a global calendar.'
          )}
        </p>
      </div>

      <div className="flex-1 bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
        {selectedEntityId && dateFieldName ? (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            height="100%"
            eventClick={(info) => {
              alert(`Record ID: ${info.event.id}\nTitle: ${info.event.title}`);
            }}
            eventClassNames="cursor-pointer hover:opacity-80 transition-opacity bg-indigo-600 border-indigo-600 text-white rounded-md px-1"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl text-slate-500">
            <CalendarIcon size={64} className="mb-4 opacity-10" />
            <p className="text-xl font-medium">
              {selectedEntityId ? 'No date fields found on this entity.' : 'Loading calendar...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
