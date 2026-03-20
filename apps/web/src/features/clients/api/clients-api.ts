import api from '../../../lib/api';
import { Client, ClientsListResponse, ClientsListParams, CreateClientInput, UpdateClientInput } from '../types';

export const clientsApi = {
  list: (params?: ClientsListParams, signal?: AbortSignal) =>
    api.get<ClientsListResponse>('/clients', { params, signal }).then((r) => r.data),

  get: (id: string) =>
    api.get<Client>(`/clients/${id}`).then((r) => r.data),

  create: (data: CreateClientInput) =>
    api.post<Client>('/clients', data).then((r) => r.data),

  update: (id: string, data: UpdateClientInput) =>
    api.patch<Client>(`/clients/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/clients/${id}`),

  linkContact: (clientId: string, contactId: string) =>
    api.post(`/clients/${clientId}/contacts/link`, { contactId }).then((r) => r.data),

  unlinkContact: (clientId: string, contactId: string) =>
    api.delete(`/clients/${clientId}/contacts/${contactId}`),
};
