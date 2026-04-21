import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, EyeOff, Lock } from 'lucide-react';

const KanbanCard = ({ record, readonly }: { record: any; readonly?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id, disabled: readonly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl border shadow-sm transition-shadow group relative mb-3 ${
        readonly
          ? 'bg-slate-800/50 border-slate-700/50 opacity-60 cursor-not-allowed'
          : 'bg-slate-700 border-slate-600 hover:shadow-md cursor-default'
      }`}
    >
      {!readonly && (
        <div {...attributes} {...listeners} className="absolute left-2 top-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
      )}
      <div className="pl-4">
        <h4 className={`font-bold truncate ${readonly ? 'text-slate-400' : 'text-white'}`}>
          {record.data.title || record.data.name || `#${record.id}`}
        </h4>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
          {record.data.description || 'No description provided'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            ID: {record.id}
          </span>
          {!readonly && (
            <button className="text-indigo-400 hover:bg-indigo-900/30 p-1 rounded transition-colors">
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const KanbanColumn = ({
  id,
  title,
  records,
  readonly,
}: {
  id: string;
  title: string;
  records: any[];
  readonly?: boolean;
}) => {
  const { setNodeRef } = useSortable({ id, disabled: readonly });

  return (
    <div
      className={`rounded-2xl p-4 w-80 flex-shrink-0 flex flex-col h-full border transition-colors ${
        readonly
          ? 'bg-slate-800/30 border-slate-700/30'
          : 'bg-slate-800/70 border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className={`font-bold uppercase tracking-wide text-sm flex items-center gap-2 ${readonly ? 'text-slate-500' : 'text-slate-300'}`}>
          {title}
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${readonly ? 'bg-slate-700/50 text-slate-600' : 'bg-slate-700 text-slate-400'}`}>
            {records.length}
          </span>
        </h3>
        {readonly && (
          <div className="flex items-center gap-1 text-[10px] font-black text-amber-600/70 bg-amber-900/20 border border-amber-800/30 px-2 py-1 rounded-lg">
            <Lock size={9} />
            <span>Read Only</span>
          </div>
        )}
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto scrollbar-hide min-h-[200px]">
        <SortableContext id={id} items={records.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {records.map((record) => (
            <KanbanCard key={record.id} record={record} readonly={readonly} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
