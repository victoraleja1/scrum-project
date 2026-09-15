import {
  GripVertical,
  MoreVertical,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string }> = {
  BACKLOG: { label: 'Backlog' },
  TODO: { label: 'To Do' },
  IN_PROGRESS: { label: 'In Progress' },
  DONE: { label: 'Done' },
};

export function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onDragStart,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600/90 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none"
    >
      {/* Card Header: Points & Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Zap className="h-2.5 w-2.5" />
            {task.points} {task.points === 1 ? 'pt' : 'pts'}
          </span>
        </div>

        {/* Quick Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 opacity-60 group-hover:opacity-100 transition"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-20 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-1 text-xs">
                <p className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400">
                  Mover a:
                </p>
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((st) => (
                  <button
                    key={st}
                    disabled={st === task.status}
                    onClick={() => {
                      onStatusChange(task.id, st);
                      setShowMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition ${
                      st === task.status
                        ? 'text-slate-500 cursor-default'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {STATUS_CONFIG[st].label}
                  </button>
                ))}

                <div className="h-px bg-slate-800 my-1" />

                <button
                  onClick={() => {
                    onDelete(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer: Assignee & Sprint badge */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/40 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <div
              title={task.assignee.name || task.assignee.email}
              className="flex items-center gap-1.5 text-slate-300"
            >
              <div className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] border border-indigo-500/30">
                {task.assignee.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="truncate max-w-[80px]">
                {task.assignee.name?.split(' ')[0] || 'Asignado'}
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-1 text-slate-500">
              <User className="h-3 w-3" />
              Sin asignar
            </span>
          )}
        </div>

        {task.sprint && (
          <span className="truncate max-w-[90px] font-medium text-slate-400">
            {task.sprint.name}
          </span>
        )}
      </div>
    </div>
  );
}
