import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onOpenCreateTask: (defaultStatus?: TaskStatus) => void;
}

interface ColumnConfig {
  status: TaskStatus;
  title: string;
  icon: typeof ListTodo;
  colorClass: string;
  borderClass: string;
  badgeClass: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'BACKLOG',
    title: 'Backlog',
    icon: Archive,
    colorClass: 'text-slate-400',
    borderClass: 'border-slate-800',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  {
    status: 'TODO',
    title: 'To Do',
    icon: ListTodo,
    colorClass: 'text-sky-400',
    borderClass: 'border-sky-500/20',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  {
    status: 'IN_PROGRESS',
    title: 'In Progress',
    icon: Clock,
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/20',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    status: 'DONE',
    title: 'Done',
    icon: CheckCircle2,
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
];

export function KanbanBoard({
  tasks,
  onStatusChange,
  onDeleteTask,
  onOpenCreateTask,
}: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        const columnPoints = columnTasks.reduce((sum, t) => sum + t.points, 0);
        const isDraggingOver = dragOverColumn === col.status;
        const Icon = col.icon;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`flex flex-col bg-slate-900/40 rounded-2xl border transition-all duration-200 min-h-[500px] p-3.5 sm:p-4 ${
              isDraggingOver
                ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                : 'border-slate-800/80 hover:border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${col.colorClass}`} />
                <h3 className="font-semibold text-sm text-slate-100">{col.title}</h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.badgeClass}`}
                >
                  {columnTasks.length}
                </span>
              </div>

              {columnPoints > 0 && (
                <span className="text-xs text-slate-400 font-medium">
                  {columnPoints} {columnPoints === 1 ? 'pt' : 'pts'}
                </span>
              )}
            </div>

            {/* Task Cards List */}
            <div className="flex-1 space-y-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onDelete={onDeleteTask}
                  onDragStart={handleDragStart}
                />
              ))}

              {columnTasks.length === 0 && (
                <div
                  className={`h-28 border border-dashed rounded-xl flex flex-col items-center justify-center text-xs transition ${
                    isDraggingOver
                      ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800 text-slate-500'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 mb-1 opacity-50" />
                  {isDraggingOver ? 'Soltar aquí' : 'Sin tareas'}
                </div>
              )}
            </div>

            {/* Column Add Task Button */}
            <button
              onClick={() => onOpenCreateTask(col.status)}
              className="mt-3 w-full py-2 px-3 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 flex items-center justify-center gap-1.5 transition group"
            >
              <Plus className="h-3.5 w-3.5 group-hover:scale-110 transition" />
              Añadir tarea
            </button>
          </div>
        );
      })}
    </div>
  );
}
