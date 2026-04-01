import axios from 'axios';
import Cookies from 'js-cookie';
import { getPublicApiBaseUrl } from './asset-url';
import { authTokenCookieAttrs } from './auth-cookie';

export const API_URL = getPublicApiBaseUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token', authTokenCookieAttrs());
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Stores
export const storesApi = {
  list: () => api.get('/stores'),
  get: (id: string) => api.get(`/stores/${id}`),
  getBySubdomain: (subdomain: string) => api.get(`/stores/by-subdomain/${subdomain}`),
  updateSettings: (id: string, data: Record<string, unknown>) => api.patch(`/stores/${id}/settings`, data),
  getAnalytics: (id: string, period: string) => api.get(`/stores/${id}/analytics?period=${period}`),
  getInsights: (id: string) => api.get(`/stores/${id}/insights`),
  getTemplates: () => api.get('/stores/templates/list'),
  getTemplate: (templateId: string) => api.get(`/stores/templates/${templateId}`),
  /**
   * Multipart image upload; returns { path, url }.
   * Always POSTs to `NEXT_PUBLIC_API_URL` so the request is not proxied through Next.js
   * (rewrites can break or strip multipart bodies). CORS must allow the dashboard origin.
   */
  /** Multipart body must be `{ file: File }` only so the API can use `request.file()` reliably (same as hero). */
  uploadImage: async (tenantId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = Cookies.get('auth_token');
    const base = API_URL.replace(/\/$/, '');
    const uploadUrl = `${base}/api/v1/stores/${tenantId}/upload`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('File is too large (max 5MB).');
      }
      const err = await res.json().catch(() => ({}));
      const message = (err as { error?: string }).error;
      if (message) throw new Error(message);
      throw new Error(`Upload failed (${res.status})`);
    }
    return res.json() as Promise<{ path: string; url: string }>;
  },
};

// Products
export const productsApi = {
  list: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/products/${tenantId}`, { params }),
  listPublic: (subdomain: string, params?: Record<string, unknown>) =>
    api.get(`/products/public/${subdomain}`, { params }),
  getPublic: (subdomain: string, productId: string) =>
    api.get(`/products/public/${subdomain}/${productId}`),
  create: (tenantId: string, data: Record<string, unknown>) =>
    api.post(`/products/${tenantId}`, data),
  update: (tenantId: string, productId: string, data: Record<string, unknown>) =>
    api.patch(`/products/${tenantId}/${productId}`, data),
  delete: (tenantId: string, productId: string) =>
    api.delete(`/products/${tenantId}/${productId}`),
  aiGenerate: (tenantId: string, count: number) =>
    api.post(`/products/${tenantId}/ai-generate`, { count }),
  optimizePricing: (tenantId: string) =>
    api.post(`/products/${tenantId}/optimize-pricing`),
  getCategories: (tenantId: string) =>
    api.get(`/products/${tenantId}/categories`),
};

// Orders
export const ordersApi = {
  list: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/orders/${tenantId}`, { params }),
  get: (tenantId: string, orderId: string) => api.get(`/orders/${tenantId}/${orderId}`),
  create: (subdomain: string, data: Record<string, unknown>) =>
    api.post(`/orders/public/${subdomain}`, data),
  uploadPaymentSlip: (subdomain: string, orderId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/orders/public/${subdomain}/${orderId}/payment-slip`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateStatus: (tenantId: string, orderId: string, data: Record<string, unknown>) =>
    api.patch(`/orders/${tenantId}/${orderId}/status`, data),
};

// Agents
export const agentsApi = {
  dispatch: (tenantId: string, agentType: string, payload: Record<string, unknown>) =>
    api.post(`/agents/${tenantId}/dispatch`, { agentType, payload }),
  run: (tenantId: string, agentType: string, payload: Record<string, unknown>) =>
    api.post(`/agents/${tenantId}/run`, { agentType, payload }),
  getTasks: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/agents/${tenantId}/tasks`, { params }),
  getTask: (tenantId: string, taskId: string) =>
    api.get(`/agents/${tenantId}/tasks/${taskId}`),
  getRecommendations: (tenantId: string) =>
    api.get(`/agents/${tenantId}/recommendations`),
  getInsights: (tenantId: string) => api.get(`/agents/${tenantId}/insights`),
  getMessages: (tenantId: string) => api.get(`/agents/${tenantId}/messages`),
  support: (tenantId: string, query: string) =>
    api.post(`/agents/${tenantId}/support`, { query }),
  growthAnalysis: (tenantId: string) =>
    api.post(`/agents/${tenantId}/growth-analysis`),
};

// Payments
export const paymentsApi = {
  initializePaystack: (tenantId: string, orderId: string, callbackUrl?: string) =>
    api.post(`/payments/${tenantId}/paystack/initialize`, { orderId, callbackUrl }),
  verifyPaystack: (tenantId: string, reference: string) =>
    api.post(`/payments/${tenantId}/paystack/verify`, { reference }),
  testPaystackKey: (tenantId: string, secretKey: string) =>
    api.post(`/payments/${tenantId}/paystack/test`, { secretKey }),
  confirmBankTransfer: (tenantId: string, orderId: string) =>
    api.post(`/payments/${tenantId}/bank-transfer/confirm`, { orderId }),
  publicInitialize: (subdomain: string, orderId: string, callbackUrl?: string) =>
    api.post(`/payments/public/${subdomain}/initialize`, { orderId, callbackUrl }),
  publicMethods: (subdomain: string) => api.get(`/payments/public/${subdomain}/methods`),
};

// Analytics
export const analyticsApi = {
  track: (data: Record<string, unknown>) => api.post('/analytics/track', data),
  summary: (tenantId: string, period: string) =>
    api.get(`/analytics/${tenantId}/summary?period=${period}`),
  funnel: (tenantId: string) => api.get(`/analytics/${tenantId}/funnel`),
  overview: (tenantId: string) => api.get(`/analytics/${tenantId}/overview`),
};

// Customers
export const customersApi = {
  list: (tenantId: string, params?: Record<string, unknown>) =>
    api.get(`/customers/${tenantId}`, { params }),
  get: (tenantId: string, customerId: string) =>
    api.get(`/customers/${tenantId}/${customerId}`),
  stats: (tenantId: string) => api.get(`/customers/${tenantId}/stats/overview`),
};
