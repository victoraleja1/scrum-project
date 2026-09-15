import { KanbanSquare, LogOut, Plus, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import type { Sprint } from '../types';

interface NavbarProps {
  activeSprint: Sprint | null;
  onOpenCreateTask: () => void;
  onOpenCreateSprint: () => void;
}

export function Navbar({
  activeSprint,
  onOpenCreateTask,
  onOpenCreateSprint,
}: NavbarProps) {
  const { dbUser, firebaseUser, logout } = useAuth();
  const displayName = dbUser?.name || firebaseUser?.displayName || 'Usuario Scrum';
  const displayEmail = dbUser?.email || firebaseUser?.email || '';

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white">ScrumFlow</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">Kanban & Sprints Manager</p>
          </div>
        </div>

        {/* Center: Active Sprint Pill */}
        {activeSprint && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Sprint Activo:</span>
            <span className="font-semibold text-white">{activeSprint.name}</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenCreateSprint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Sprint
          </button>

          <button
            onClick={onOpenCreateTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva Tarea
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* User badge */}
          <div className="flex items-center gap-2 text-left">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-xs">
              {displayName.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-medium text-slate-200 leading-none">{displayName}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-1 truncate max-w-[120px]">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
