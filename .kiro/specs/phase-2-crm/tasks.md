# Phase 2 — CRM Module Tasks

## Status Legend
- [ ] Not started
- [x] Complete

---

## Backend Tasks

### Task 1 — clients.types.ts
- [ ] Define `CreateClientDto`, `UpdateClientDto`, `ClientResponse`, `ListClientsQuery`
- [ ] Define `UpdateFirmDto`, `FirmResponse`
- [ ] Define `LinkContactDto`

### Task 2 — clients.validation.ts
- [ ] `CreateClientSchema` — name required, optional: email, phone, type, status, taxId, website, notes
- [ ] `UpdateClientSchema` — all optional
- [ ] `UpdateFirmSchema` — all optional: name, email, phone, address, website, timezone
- [ ] `LinkContactSchema` — contactId required uuid
- [ ] `ListClientsQuerySchema` — search optional, page/limit with defaults

### Task 3 — clients.repository.ts
- [ ] `findByFirm(firmId, opts)` — paginated, ILIKE search on name, exclude deleted_at
- [ ] `findById(firmId, clientId)` — single client, firm-scoped, exclude deleted
- [ ] `create(firmId, data)` — insert client
- [ ] `update(firmId, clientId, data)` — update client
- [ ] `softDelete(firmId, clientId)` — set deleted_at
- [ ] `linkContact(firmId, clientId, contactId)` — insert client_contacts
- [ ] `unlinkContact(firmId, clientId, contactId)` — delete from client_contacts
- [ ] `findLink(firmId, clientId, contactId)` — check if link exists
- [ ] `findFirmById(firmId)` — get firm
- [ ] `updateFirm(firmId, data)` — update firm

### Task 4 — clients.service.ts
- [ ] `getFirm(firmId)` — find or throw NOT_FOUND
- [ ] `updateFirm(firmId, data)` — update firm profile
- [ ] `listClients(firmId, query)` — paginated list with search
- [ ] `getClient(firmId, clientId)` — find or throw NOT_FOUND
- [ ] `createClient(firmId, data)` — create client
- [ ] `updateClient(firmId, clientId, data)` — update or throw NOT_FOUND
- [ ] `deleteClient(firmId, clientId)` — soft delete or throw NOT_FOUND
- [ ] `linkContact(firmId, clientId, contactId)` — check both exist, check no duplicate, link
- [ ] `unlinkContact(firmId, clientId, contactId)` — check link exists, unlink

### Task 5 — clients.controller.ts
- [ ] `getFirm` — GET /firms/:id
- [ ] `updateFirm` — PATCH /firms/:id
- [ ] `listClients` — GET /clients
- [ ] `getClient` — GET /clients/:id
- [ ] `createClient` — POST /clients
- [ ] `updateClient` — PATCH /clients/:id
- [ ] `deleteClient` — DELETE /clients/:id
- [ ] `linkContact` — POST /clients/:id/contacts/link
- [ ] `unlinkContact` — DELETE /clients/:id/contacts/:contactId

### Task 6 — clients.routes.ts
- [ ] Wire all client + firm + relationship routes with middleware

### Task 7 — contacts.types.ts
- [ ] Define `CreateContactDto`, `UpdateContactDto`, `ContactResponse`, `ListContactsQuery`

### Task 8 — contacts.validation.ts
- [ ] `CreateContactSchema` — name required, optional: email, phone, title, notes
- [ ] `UpdateContactSchema` — all optional
- [ ] `ListContactsQuerySchema` — page/limit with defaults

### Task 9 — contacts.repository.ts
- [ ] `findByFirm(firmId, opts)` — paginated, exclude deleted_at
- [ ] `findById(firmId, contactId)` — firm-scoped, exclude deleted
- [ ] `create(firmId, data)` — insert contact
- [ ] `update(firmId, contactId, data)` — update contact
- [ ] `delete(firmId, contactId)` — hard delete

### Task 10 — contacts.service.ts
- [ ] `listContacts(firmId, query)`
- [ ] `getContact(firmId, contactId)` — find or throw NOT_FOUND
- [ ] `createContact(firmId, data)`
- [ ] `updateContact(firmId, contactId, data)` — find or throw NOT_FOUND
- [ ] `deleteContact(firmId, contactId)` — find or throw NOT_FOUND

### Task 11 — contacts.controller.ts
- [ ] `listContacts` — GET /contacts
- [ ] `getContact` — GET /contacts/:id
- [ ] `createContact` — POST /contacts
- [ ] `updateContact` — PATCH /contacts/:id
- [ ] `deleteContact` — DELETE /contacts/:id

### Task 12 — contacts.routes.ts
- [ ] Wire all contact routes with middleware

### Task 13 — crm/index.ts
- [ ] Aggregate clients router + contacts router into single CRM router
- [ ] Export for mounting in app.ts

### Task 14 — app.ts update
- [ ] Mount CRM router at `/api/v1`

---

## Frontend Tasks

### Task 15 — clients/types.ts
- [ ] `Client`, `CreateClientInput`, `UpdateClientInput`, `ClientsListResponse`

### Task 16 — clients/api/clients-api.ts
- [ ] `listClients(params)`, `getClient(id)`, `createClient(data)`, `updateClient(id, data)`, `deleteClient(id)`
- [ ] `linkContact(clientId, contactId)`, `unlinkContact(clientId, contactId)`

### Task 17 — clients/hooks/
- [ ] `useClients(query)` — list with search/pagination
- [ ] `useClient(id)` — single client
- [ ] `useCreateClient()` — mutation
- [ ] `useUpdateClient()` — mutation

### Task 18 — clients/components/ClientList.tsx
- [ ] DataTable with columns: name, email, phone, status, type, actions
- [ ] Search input (debounced)
- [ ] Pagination
- [ ] Delete (soft) with confirmation

### Task 19 — clients/components/ClientForm.tsx
- [ ] Form for create/edit
- [ ] Fields: name, email, phone, type, status, taxId, website, notes

### Task 20 — clients/components/ClientDetails.tsx
- [ ] Client info card
- [ ] Linked contacts table with unlink action

### Task 21 — contacts/types.ts + contacts/api/contacts-api.ts
- [ ] Types and API functions mirroring clients pattern

### Task 22 — contacts/hooks/
- [ ] `useContacts()`, `useCreateContact()`, `useUpdateContact()`

### Task 23 — contacts/components/ContactList.tsx + ContactForm.tsx
- [ ] List with DataTable
- [ ] Form for create/edit

### Task 24 — Pages
- [ ] Dashboard page (basic stats placeholder)
- [ ] Clients list page
- [ ] Client detail page
- [ ] Client new/edit page
- [ ] Contacts list page
- [ ] Contact new/edit page

---

## Verification

- [ ] `GET /clients?search=john` returns filtered results
- [ ] `DELETE /clients/:id` sets deleted_at, client disappears from list
- [ ] `POST /clients/:id/contacts/link` twice returns 409
- [ ] Cross-tenant access returns 404
- [ ] TypeScript compiles with no errors
