export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'business' | 'nonprofit';
  status?: 'active' | 'inactive' | 'archived' | 'lead';
  taxId?: string;
  website?: string;
  notes?: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'business' | 'nonprofit';
  status?: 'active' | 'inactive' | 'archived' | 'lead';
  taxId?: string;
  website?: string;
  notes?: string;
}

export interface UpdateFirmDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  timezone?: string;
}

export interface LinkContactDto {
  contactId: string;
}

export interface ListClientsQuery {
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
