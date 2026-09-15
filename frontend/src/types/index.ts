export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    tasks: number;
  };
  metrics?: {
    totalTasks: number;
    totalPoints: number;
    completedPoints: number;
    progressPercentage: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  points: number;
  status: TaskStatus;
  sprintId?: string | null;
  assigneeId?: string | null;
  sprint?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ScrumMetrics {
  totalTasks: number;
  totalPoints: number;
  completedPoints: number;
  progressPercentage: number;
  byStatus: Record<TaskStatus, { count: number; points: number }>;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  points?: number;
  status?: TaskStatus;
  sprintId?: string;
  assigneeId?: string;
}

export interface CreateSprintPayload {
  name: string;
  isActive?: boolean;
}
