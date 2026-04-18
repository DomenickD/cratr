import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

export default function CalendarPage() {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [dateFieldName, setDateFieldName] = useState<string>('');

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

  const dateFields = useMemo(() => 
    selectedEntity?.fields?.filter((f: any) => f.field_type === 'date') || [],
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarIcon className="text-indigo-600" />
            Calendar View
          </h1>
          <p className="text-slate-500 mt-1">Visualize time-sensitive records on a global calendar.</p>
        </div>

        <div className="flex gap-4">
          <select 
            className="rounded-lg border-slate-200 shadow-sm p-2 bg-white text-sm"
            onChange={(e) => {
                setSelectedEntityId(Number(e.target.value));
                setDateFieldName('');
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
              onChange={(e) => setDateFieldName(e.target.value)}
              value={dateFieldName}
            >
              <option value="">Select Date Field...</option>
              {dateFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.display_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
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
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
             <CalendarIcon size={64} className="mb-4 opacity-10" />
             <p className="text-xl font-medium">Select an entity and a date field to view the calendar</p>
             <div className="flex items-center gap-2 mt-4 text-sm bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <Info size={14} className="text-indigo-500" />
                <span>The entity must have at least one 'Date' field defined.</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
