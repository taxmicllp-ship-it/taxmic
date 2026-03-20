// Unit tests for window.confirm → ConfirmModal replacements
// Requirements: 6.1–6.9

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={makeQC()}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ===========================================================================
// 1. ClientList
// ===========================================================================

vi.mock('../features/clients/hooks/useClients', () => ({
  useClients: () => ({
    data: {
      data: [{ id: 'c1', name: 'Acme Corp', email: 'a@b.com', type: 'business', status: 'active' }],
      total: 1,
      limit: 20,
    },
    isLoading: false,
  }),
}));

const mockClientDelete = vi.fn().mockResolvedValue(undefined);
vi.mock('../features/clients/api/clients-api', () => ({
  clientsApi: { delete: (...args: unknown[]) => mockClientDelete(...args) },
}));

import ClientList from '../features/clients/components/ClientList';

describe('ClientList — ConfirmModal replaces window.confirm', () => {
  it('renders without calling window.confirm', () => {
    const spy = vi.spyOn(window, 'confirm');
    render(<Wrapper><ClientList /></Wrapper>);
    expect(spy).not.toHaveBeenCalled();
  });

  it('opens a dialog when Delete is clicked', () => {
    render(<Wrapper><ClientList /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does NOT call delete mutation when Cancel is clicked', () => {
    render(<Wrapper><ClientList /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockClientDelete).not.toHaveBeenCalled();
  });

  it('calls delete mutation when Confirm is clicked', async () => {
    render(<Wrapper><ClientList /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => expect(mockClientDelete).toHaveBeenCalledWith('c1'));
  });
});

// ===========================================================================
// 2. ContactList
// ===========================================================================

vi.mock('../features/contacts/hooks/useContacts', () => ({
  useContacts: () => ({
    data: {
      data: [{ id: 'ct1', name: 'Jane Doe', email: 'j@d.com', phone: null, title: null }],
      total: 1,
      limit: 20,
    },
    isLoading: false,
  }),
}));

const mockContactDelete = vi.fn().mockResolvedValue(undefined);
vi.mock('../features/contacts/api/contacts-api', () => ({
  contactsApi: { delete: (...args: unknown[]) => mockContactDelete(...args) },
}));

import ContactList from '../features/contacts/components/ContactList';

describe('ContactList — ConfirmModal replaces window.confirm', () => {
  it('renders without calling window.confirm', () => {
    const spy = vi.spyOn(window, 'confirm');
    render(<Wrapper><ContactList /></Wrapper>);
    expect(spy).not.toHaveBeenCalled();
  });

  it('opens a dialog when Delete is clicked', () => {
    render(<Wrapper><ContactList /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does NOT call delete mutation when Cancel is clicked', () => {
    render(<Wrapper><ContactList /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockContactDelete).not.toHaveBeenCalled();
  });

  it('calls delete mutation when Confirm is clicked', async () => {
    render(<Wrapper><ContactList /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => expect(mockContactDelete).toHaveBeenCalledWith('ct1'));
  });
});

// ===========================================================================
// 3. TasksPage (index)
// ===========================================================================

vi.mock('../features/tasks/hooks/useTasks', () => ({
  useTasks: () => ({
    data: {
      data: [{ id: 't1', title: 'Fix bug', status: 'new', priority: 'medium', due_date: null }],
    },
    isLoading: false,
  }),
}));

vi.mock('../features/tasks/hooks/useUpdateTask', () => ({
  useUpdateTask: () => ({ mutate: vi.fn() }),
}));

const mockTaskDelete = vi.fn().mockResolvedValue(undefined);
vi.mock('../features/tasks/api/tasks-api', () => ({
  tasksApi: {
    delete: (...args: unknown[]) => mockTaskDelete(...args),
    get: vi.fn(),
  },
}));

import TasksPage from '../pages/tasks/index';

describe('TasksPage — ConfirmModal replaces window.confirm', () => {
  it('renders without calling window.confirm', () => {
    const spy = vi.spyOn(window, 'confirm');
    render(<Wrapper><TasksPage /></Wrapper>);
    expect(spy).not.toHaveBeenCalled();
  });

  it('opens a dialog when Delete is clicked', () => {
    render(<Wrapper><TasksPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does NOT call delete when Cancel is clicked', () => {
    render(<Wrapper><TasksPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockTaskDelete).not.toHaveBeenCalled();
  });

  it('calls tasksApi.delete when Confirm is clicked', async () => {
    render(<Wrapper><TasksPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => expect(mockTaskDelete).toHaveBeenCalledWith('t1'));
  });
});

// ===========================================================================
// 4. TaskDetailPage ([id].tsx)
// ===========================================================================

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'task-detail-1' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
      // Only intercept task detail queries
      if (Array.isArray(queryKey) && queryKey[0] === 'tasks') {
        return {
          data: { id: 'task-detail-1', title: 'Detail Task', status: 'new', priority: 'low', due_date: null },
          isLoading: false,
        };
      }
      return { data: undefined, isLoading: false };
    },
  };
});

import TaskDetailPage from '../pages/tasks/[id]';

describe('TaskDetailPage — ConfirmModal replaces window.confirm', () => {
  it('renders without calling window.confirm', () => {
    const spy = vi.spyOn(window, 'confirm');
    render(<Wrapper><TaskDetailPage /></Wrapper>);
    expect(spy).not.toHaveBeenCalled();
  });

  it('opens a dialog when Delete is clicked', () => {
    render(<Wrapper><TaskDetailPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does NOT call delete when Cancel is clicked', () => {
    render(<Wrapper><TaskDetailPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockTaskDelete).not.toHaveBeenCalled();
  });

  it('calls tasksApi.delete when Confirm is clicked', async () => {
    render(<Wrapper><TaskDetailPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => expect(mockTaskDelete).toHaveBeenCalledWith('task-detail-1'));
  });
});

// ===========================================================================
// 5. SubscriptionPage
// ===========================================================================

const mockCancelMutate = vi.fn();
vi.mock('../features/billing/hooks/useSubscription', () => ({
  useCurrentSubscription: () => ({
    data: {
      id: 'sub-1',
      plan_id: 'plan-starter',
      plan: { name: 'Starter' },
      status: 'active',
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    isLoading: false,
  }),
  useCancelSubscription: () => ({
    mutate: mockCancelMutate,
    isPending: false,
  }),
}));

import SubscriptionPage from '../pages/billing/subscription';

describe('SubscriptionPage — ConfirmModal replaces window.confirm', () => {
  it('renders without calling window.confirm', () => {
    const spy = vi.spyOn(window, 'confirm');
    render(<Wrapper><SubscriptionPage /></Wrapper>);
    expect(spy).not.toHaveBeenCalled();
  });

  it('opens a dialog when Cancel Subscription is clicked', () => {
    render(<Wrapper><SubscriptionPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /cancel subscription/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does NOT call cancel mutation when modal Cancel is clicked', () => {
    render(<Wrapper><SubscriptionPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /cancel subscription/i }));
    // The modal's cancel button (labelled "Cancel")
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(mockCancelMutate).not.toHaveBeenCalled();
  });

  it('calls cancel mutation when modal Confirm is clicked', () => {
    render(<Wrapper><SubscriptionPage /></Wrapper>);
    fireEvent.click(screen.getByRole('button', { name: /cancel subscription/i }));
    // The modal's confirm button (labelled "Cancel Subscription")
    const buttons = screen.getAllByRole('button', { name: /cancel subscription/i });
    // The confirm button inside the modal footer is the last one
    fireEvent.click(buttons[buttons.length - 1]);
    expect(mockCancelMutate).toHaveBeenCalledTimes(1);
  });
});
