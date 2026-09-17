import { User, Business, Persona, Dataset, DatasetFullMetadata, Message, Conversation, Dashboard, PipelineItem, VisualConfig } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; confirmPassword: string; name: string }) =>
    fetchJson<{ success: boolean; message: string; user: User; verificationHint?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; password: string }) =>
    fetchJson<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  verify: (data: { email: string; code: string }) =>
    fetchJson<{ success: boolean; message: string; user: User }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Setup / Metadata
  getBusinesses: () => fetchJson<Business[]>('/api/businesses'),
  getPersonas: () => fetchJson<Persona[]>('/api/personas'),
  getDatasets: () => fetchJson<Dataset[]>('/api/datasets'),
  getDatasetMetadata: (datasetId: string) => fetchJson<DatasetFullMetadata>(`/api/datasets/${datasetId}/metadata`),

  // Queries
  queryTable: (datasetId: string, params: { table: string; dimension?: string; measure?: string; aggregation?: string; limit?: number; rawSql?: string }) =>
    fetchJson<{ columns: string[]; rows: any[]; total_rows: number; bytes_processed: string; execution_time_ms: number; sql: string }>(`/api/datasets/${datasetId}/query`, {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Chat
  sendMessage: (payload: {
    message: string;
    conversation_id?: string;
    user_id: string;
    persona_id: string;
    business_id: string;
    dataset_id: string;
    current_visual_context?: any;
  }) =>
    fetchJson<{ conversation_id: string; user_message: Message; response: Message }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Conversations
  getConversations: (userId: string) => fetchJson<Conversation[]>(`/api/conversations?user_id=${encodeURIComponent(userId)}`),
  getConversationDetails: (id: string) => fetchJson<{ conversation: Conversation; messages: Message[] }>(`/api/conversations/${id}`),
  deleteConversation: (id: string) => fetchJson<{ success: boolean }>(`/api/conversations/${id}`, { method: 'DELETE' }),

  // Dashboards
  getDashboards: (userId: string, userEmail: string) =>
    fetchJson<Dashboard[]>(`/api/dashboards?user_id=${encodeURIComponent(userId)}&user_email=${encodeURIComponent(userEmail)}`),
  getDashboardDetails: (id: string) => fetchJson<Dashboard>(`/api/dashboards/${id}`),
  createDashboard: (data: Partial<Dashboard>) =>
    fetchJson<Dashboard>('/api/dashboards', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateDashboard: (id: string, data: Partial<Dashboard> & { user_id: string; user_email: string }) =>
    fetchJson<Dashboard>(`/api/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteDashboard: (id: string) => fetchJson<{ success: boolean }>(`/api/dashboards/${id}`, { method: 'DELETE' }),
  shareDashboard: (id: string, shareData: { email: string; permission: 'viewer' | 'editor'; shared_by: string }) =>
    fetchJson<any>(`/api/dashboards/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(shareData)
    }),

  // Pipeline
  getPipeline: (filters?: { persona?: string; business_area?: string; dataset_id?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.persona) params.append('persona', filters.persona);
    if (filters?.business_area) params.append('business_area', filters.business_area);
    if (filters?.dataset_id) params.append('dataset_id', filters.dataset_id);
    if (filters?.status) params.append('status', filters.status);
    return fetchJson<{ total: number; items: PipelineItem[] }>(`/api/pipeline?${params.toString()}`);
  }
};
