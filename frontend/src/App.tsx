import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './context/useAuth';
import { api } from './lib/api';
import type {
  CreateSprintPayload,
  CreateTaskPayload,
  ScrumMetrics,
  Sprint,
  Task,
  TaskStatus,
} from './types';
import { Navbar } from './components/Navbar';
import { SprintHeader } from './components/SprintHeader';
import { KanbanBoard } from './components/KanbanBoard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateSprintModal } from './components/CreateSprintModal';
import { LoginView } from './components/LoginView';
import { Loader2 } from 'lucide-react';

export function App() {
  const { token, loading: authLoading } = useAuth();

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('ALL');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<ScrumMetrics | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] =
    useState<TaskStatus>('TODO');

  // Carga de Sprints, Tareas y Métricas
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const allSprints = await api.sprints.getAll(token);
      setSprints(allSprints);

      if (selectedSprintId === 'ALL') {
        const active = allSprints.find((s) => s.isActive);
        if (active) {
          setSelectedSprintId(active.id);
        }
      }

      const sprintFilter =
        selectedSprintId === 'ALL' ? undefined : selectedSprintId;

      const [loadedTasks, loadedMetrics] = await Promise.all([
        api.tasks.getAll(token, { sprintId: sprintFilter }),
        api.tasks.getMetrics(token, sprintFilter),
      ]);

      setTasks(loadedTasks);
      setMetrics(loadedMetrics);
    } catch (err) {
      console.error('Error al cargar datos del tablero:', err);
    } finally {
      setLoadingData(false);
    }
  }, [token, selectedSprintId]);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      void (async () => {
        if (isMounted) {
          await loadData();
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [token, loadData]);

  // Actualización optimista del estado de una tarjeta al arrastrar
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!token) return;

    // Actualización optimista local
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await api.tasks.updateStatus(token, taskId, newStatus);
      // Recalcular métricas de fondo
      const sprintFilter =
        selectedSprintId === 'ALL' ? undefined : selectedSprintId;
      const updatedMetrics = await api.tasks.getMetrics(token, sprintFilter);
      setMetrics(updatedMetrics);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      // Revertir recargando
      loadData();
    }
  };

  // Crear Tarea
  const handleCreateTask = async (payload: CreateTaskPayload) => {
    if (!token) return;
    await api.tasks.create(token, payload);
    await loadData();
  };

  // Crear Sprint
  const handleCreateSprint = async (payload: CreateSprintPayload) => {
    if (!token) return;
    const newSprint = await api.sprints.create(token, payload);
    if (newSprint.isActive) {
      setSelectedSprintId(newSprint.id);
    }
    await loadData();
  };

  // Activar Sprint
  const handleActivateSprint = async (sprintId: string) => {
    if (!token) return;
    await api.sprints.update(token, sprintId, { isActive: true });
    setSelectedSprintId(sprintId);
    await loadData();
  };

  // Eliminar Tarea
  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.tasks.delete(token, taskId);
      const sprintFilter =
        selectedSprintId === 'ALL' ? undefined : selectedSprintId;
      const updatedMetrics = await api.tasks.getMetrics(token, sprintFilter);
      setMetrics(updatedMetrics);
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      loadData();
    }
  };

  // Abrir modal con estado predeterminado
  const openCreateTaskWithStatus = (st: TaskStatus = 'TODO') => {
    setModalDefaultStatus(st);
    setIsTaskModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <LoginView />;
  }

  const activeSprint = sprints.find((s) => s.isActive) || null;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar
        activeSprint={activeSprint}
        onOpenCreateTask={() => openCreateTaskWithStatus('TODO')}
        onOpenCreateSprint={() => setIsSprintModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SprintHeader
          sprints={sprints}
          selectedSprintId={selectedSprintId}
          onSelectSprint={(id) => setSelectedSprintId(id)}
          metrics={metrics}
          onActivateSprint={handleActivateSprint}
        />

        {loadingData && tasks.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-sm">Cargando tablero Kanban...</span>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onDeleteTask={handleDeleteTask}
            onOpenCreateTask={openCreateTaskWithStatus}
          />
        )}
      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        sprints={sprints}
        defaultStatus={modalDefaultStatus}
        defaultSprintId={selectedSprintId !== 'ALL' ? selectedSprintId : undefined}
      />

      <CreateSprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSubmit={handleCreateSprint}
      />
    </div>
  );
}

export default App;
