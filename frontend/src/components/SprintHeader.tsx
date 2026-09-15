import {
  CheckCircle2,
  ChevronDown,
  Flame,
  ListTodo,
  Sparkles,
} from 'lucide-react';
import type { ScrumMetrics, Sprint } from '../types';

interface SprintHeaderProps {
  sprints: Sprint[];
  selectedSprintId: string;
  onSelectSprint: (id: string) => void;
  metrics: ScrumMetrics | null;
  onActivateSprint?: (id: string) => void;
}

export function SprintHeader({
  sprints,
  selectedSprintId,
  onSelectSprint,
  metrics,
  onActivateSprint,
}: SprintHeaderProps) {
  const currentSprint = sprints.find((s) => s.id === selectedSprintId);

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Sprint Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedSprintId}
              onChange={(e) => onSelectSprint(e.target.value)}
              className="appearance-none bg-slate-800/90 text-white font-semibold text-sm sm:text-base pl-3.5 pr-9 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-sm hover:border-slate-600 transition"
            >
              <option value="ALL">Todos los Sprints & Backlog</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isActive ? '⚡ (Activo)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {currentSprint && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  currentSprint.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    currentSprint.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {currentSprint.isActive ? 'En Curso' : 'Inactivo'}
              </span>

              {!currentSprint.isActive && onActivateSprint && (
                <button
                  onClick={() => onActivateSprint(currentSprint.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 ml-1"
                >
                  Activar este Sprint
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Scrum Story Points & Metrics */}
        {metrics && (
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <ListTodo className="h-4 w-4 text-indigo-400" />
              <span>
                <strong className="text-white font-bold">{metrics.totalTasks}</strong> tareas
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>
                <strong className="text-white font-bold">{metrics.totalPoints}</strong> pts total
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>
                <strong className="text-emerald-400 font-bold">
                  {metrics.completedPoints}
                </strong>{' '}
                pts hechos
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {metrics && metrics.totalPoints > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Avance del Sprint
            </span>
            <span className="font-semibold text-slate-200">
              {metrics.progressPercentage}% completado
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${metrics.progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
