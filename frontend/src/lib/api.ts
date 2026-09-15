import type {
  CreateSprintPayload,
  CreateTaskPayload,
  ScrumMetrics,
  Sprint,
  Task,
  TaskStatus,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = Array.isArray(errJson.message)
        ? errJson.message.join(', ')
        : errJson.message || errorDetail;
    } catch {
      // Ignora error al parsear JSON
    }
    throw new Error(errorDetail);
  }

  // Si no hay contenido (ej. 204 o delete)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    getMe: (token: string): Promise<User> => request<User>('/auth/me', token),
  },

  sprints: {
    getAll: (token: string): Promise<Sprint[]> =>
      request<Sprint[]>('/sprints', token),

    getActive: (token: string): Promise<Sprint | null> =>
      request<Sprint | null>('/sprints/active', token),

    getOne: (token: string, id: string): Promise<Sprint> =>
      request<Sprint>(`/sprints/${id}`, token),

    create: (token: string, payload: CreateSprintPayload): Promise<Sprint> =>
      request<Sprint>('/sprints', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    update: (
      token: string,
      id: string,
      payload: Partial<CreateSprintPayload>,
    ): Promise<Sprint> =>
      request<Sprint>(`/sprints/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    delete: (token: string, id: string): Promise<Sprint> =>
      request<Sprint>(`/sprints/${id}`, token, {
        method: 'DELETE',
      }),
  },

  tasks: {
    getAll: (
      token: string,
      filters: { sprintId?: string; status?: TaskStatus; assigneeId?: string } = {},
    ): Promise<Task[]> => {
      const query = new URLSearchParams();
      if (filters.sprintId) query.append('sprintId', filters.sprintId);
      if (filters.status) query.append('status', filters.status);
      if (filters.assigneeId) query.append('assigneeId', filters.assigneeId);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<Task[]>(`/tasks${qs}`, token);
    },

    getMetrics: (token: string, sprintId?: string): Promise<ScrumMetrics> => {
      const qs = sprintId ? `?sprintId=${sprintId}` : '';
      return request<ScrumMetrics>(`/tasks/metrics${qs}`, token);
    },

    create: (token: string, payload: CreateTaskPayload): Promise<Task> =>
      request<Task>('/tasks', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    updateStatus: (
      token: string,
      id: string,
      status: TaskStatus,
    ): Promise<Task> =>
      request<Task>(`/tasks/${id}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    assign: (
      token: string,
      id: string,
      assigneeId: string | null,
    ): Promise<Task> =>
      request<Task>(`/tasks/${id}/assign`, token, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId }),
      }),

    update: (
      token: string,
      id: string,
      payload: Partial<CreateTaskPayload>,
    ): Promise<Task> =>
      request<Task>(`/tasks/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    delete: (token: string, id: string): Promise<Task> =>
      request<Task>(`/tasks/${id}`, token, {
        method: 'DELETE',
      }),
  },
};
