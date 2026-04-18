import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight } from 'lucide-react';

const KanbanCard = ({ record }: { record: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: record.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative mb-3 cursor-default"
    >
      <div {...attributes} {...listeners} className="absolute left-2 top-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing">
        <GripVertical size={16} />
      </div>
      <div className="pl-4">
        <h4 className="font-bold text-slate-900 truncate">
          {record.data.title || record.data.name || `#${record.id}`}
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {record.data.description || 'No description provided'}
        </p>
        <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ID: {record.id}
            </span>
            <button className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors">
                <ChevronRight size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};

export const KanbanColumn = ({ id, title, records }: { id: string, title: string, records: any[] }) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div className="bg-slate-100/50 rounded-2xl p-4 w-80 flex-shrink-0 flex flex-col h-full border border-slate-200">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm flex items-center gap-2">
          {title}
          <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full">
            {records.length}
          </span>
        </h3>
      </div>
      
      <div ref={setNodeRef} className="flex-1 overflow-y-auto scrollbar-hide min-h-[200px]">
        <SortableContext id={id} items={records.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {records.map(record => (
            <KanbanCard key={record.id} record={record} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
