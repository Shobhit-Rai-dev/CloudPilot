const API_BASE_URL = typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:8000/api';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cloudops_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<any>('/auth/me'),

  // Dashboard
  getDashboardSummary: () => request<any>('/dashboard/summary'),

  // Resources
  getResources: (params?: { provider?: string; type?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.provider) query.set('provider', params.provider);
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/resources${qs}`);
  },

  getResource: (id: string) => request<any>(`/resources/${id}`),

  getResourceMetrics: (id: string, range: string = '1h') =>
    request<any[]>(`/resources/${id}/metrics?range=${range}`),

  getServiceHealth: (id: string) => request<any>(`/services/${id}/health`),

  // Costs
  getCosts: () => request<any>('/costs'),

  // Recommendations
  getRecommendations: (statusFilter?: string) => {
    const qs = statusFilter ? `?status_filter=${statusFilter}` : '';
    return request<any[]>(`/recommendations${qs}`);
  },

  approveRecommendation: (id: string) =>
    request<any>(`/recommendations/${id}/approve`, {
      method: 'POST',
    }),

  rejectRecommendation: (id: string) =>
    request<any>(`/recommendations/${id}/reject`, {
      method: 'POST',
    }),

  // Policies
  getPolicies: () => request<any[]>('/policies'),

  updatePolicy: (id: string, payload: any) =>
    request<any>(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Budgets
  getBudgets: () => request<any[]>('/budgets'),

  updateBudget: (id: string, payload: any) =>
    request<any>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Audit Logs
  getAuditLogs: (limit: number = 50) => request<any[]>(`/audit-logs?limit=${limit}`),

  // Cloud Accounts
  getCloudAccounts: () => request<any[]>('/cloud/accounts'),

  // Demo Simulation Controls
  triggerTrafficSpike: () =>
    request<any>('/simulation/traffic-spike', {
      method: 'POST',
    }),

  resetSimulation: () =>
    request<any>('/simulation/reset', {
      method: 'POST',
    }),

  // Metrics Ingestion
  ingestMetrics: (data: { service: string; cpu?: number; latency_p95?: number; requests?: number; error_rate?: number }) =>
    request<any>('/metrics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
