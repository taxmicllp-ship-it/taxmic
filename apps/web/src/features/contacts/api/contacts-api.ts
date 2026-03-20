import api from '../../../lib/api';
import { Contact, ContactsListResponse, CreateContactInput, UpdateContactInput } from '../types';

export const contactsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<ContactsListResponse>('/contacts', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Contact>(`/contacts/${id}`).then((r) => r.data),

  create: (data: CreateContactInput) =>
    api.post<Contact>('/contacts', data).then((r) => r.data),

  update: (id: string, data: UpdateContactInput) =>
    api.patch<Contact>(`/contacts/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
};
