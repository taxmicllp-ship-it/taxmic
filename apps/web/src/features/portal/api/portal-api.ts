import axios from 'axios';
import type { PortalDocument, PortalInvoice, PortalInvoiceDetail, PortalTask, PortalDashboard } from '../types';
import type { PortalUser } from '../context/PortalAuthContext';

const portalApi = axios.create({
  baseURL: '/api/v1/portal',
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      window.location.href = '/portal/login';
    }
    return Promise.reject(error);
  }
);

export const portalApiClient = {
  login(data: { firmSlug: string; email: string; password: string }) {
    return portalApi.post<{ token: string; user: PortalUser }>('/auth/login', data).then((r) => r.data);
  },

  getDashboard() {
    return portalApi.get<PortalDashboard>('/dashboard').then((r) => r.data);
  },

  listDocuments() {
    return portalApi.get<PortalDocument[]>('/documents').then((r) => r.data);
  },

  downloadDocument(id: string) {
    return portalApi
      .get<{ url: string; filename: string; mime_type: string }>(`/documents/${id}/download`)
      .then((r) => r.data);
  },

  uploadDocument(file: File) {
    const form = new FormData();
    form.append('file', file);
    return portalApi
      .post<PortalDocument>('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  listInvoices() {
    return portalApi.get<PortalInvoice[]>('/invoices').then((r) => r.data);
  },

  getInvoice(id: string) {
    return portalApi.get<PortalInvoiceDetail>(`/invoices/${id}`).then((r) => r.data);
  },

  payInvoice(id: string) {
    return portalApi.post<{ url: string }>(`/invoices/${id}/pay`).then((r) => r.data);
  },

  listTasks() {
    return portalApi.get<PortalTask[]>('/tasks').then((r) => r.data);
  },
};
