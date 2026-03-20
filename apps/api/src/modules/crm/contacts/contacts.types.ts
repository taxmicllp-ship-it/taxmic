export interface CreateContactDto {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
}

export interface UpdateContactDto {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
}

export interface ListContactsQuery {
  page: number;
  limit: number;
}
