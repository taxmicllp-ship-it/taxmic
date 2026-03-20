export interface Contact {
  id: string;
  firm_id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
}

export type UpdateContactInput = Partial<CreateContactInput>;

export interface ContactsListResponse {
  data: Contact[];
  total: number;
  page: number;
  limit: number;
}