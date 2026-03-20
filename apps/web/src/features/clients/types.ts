export interface Client {
  id: string;
  firm_id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'business' | 'nonprofit';
  status: 'active' | 'inactive' | 'archived' | 'lead';
  tax_id?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  type?: Client['type'];
  status?: Client['status'];
  taxId?: string;
  website?: string;
  notes?: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export interface ClientsListResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientsListParams {
  search?: string;
  page?: number;
  limit?: number;
}
