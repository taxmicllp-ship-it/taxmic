import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import ForgotPasswordPage from './pages/auth/forgot-password';
import ResetPasswordPage from './pages/auth/reset-password';
import DashboardLayout from './components/layout/DashboardLayout';
import PortalLayout from './components/layout/PortalLayout';
import PortalLoginPage from './pages/portal/login';
import PortalDashboardPage from './pages/portal/dashboard';
import PortalDocumentsPage from './pages/portal/documents';
import PortalInvoicesPage from './pages/portal/invoices';
import PortalInvoiceDetailPage from './pages/portal/invoices/[id]';
import PortalTasksPage from './pages/portal/tasks';
import PortalPaymentSuccessPage from './pages/portal/payment-success';
import DashboardPage from './pages/dashboard';
import ClientsPage from './pages/clients/index';
import ClientDetailPage from './pages/clients/[id]';
import NewClientPage from './pages/clients/new';
import EditClientPage from './pages/clients/edit';
import ContactsPage from './pages/contacts/index';
import NewContactPage from './pages/contacts/new';
import ContactDetailPage from './pages/contacts/[id]';
import EditContactPage from './pages/contacts/edit';
import DocumentsPage from './pages/documents/index';
import TasksPage from './pages/tasks/index';
import NewTaskPage from './pages/tasks/new';
import TaskDetailPage from './pages/tasks/[id]';
import TaskEditPage from './pages/tasks/[id]/edit';
import InvoicesPage from './pages/invoices/index';
import NewInvoicePage from './pages/invoices/new';
import InvoiceEditPage from './pages/invoices/[id]/edit';
import InvoiceDetailPage from './pages/invoices/[id]';
import PaymentSuccessPage from './pages/invoices/payment-success';
import PaymentFailurePage from './pages/invoices/payment-failure';
import NotificationsPage from './pages/notifications/index';
import PlansPage from './pages/billing/plans';
import AdminPlansPage from './pages/billing/admin-plans';
import SubscriptionPage from './pages/billing/subscription';
import UsagePage from './pages/billing/usage';
import HistoryPage from './pages/billing/history';
import SettingsPage from './pages/settings/index';

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<NewClientPage />} />
        <Route path="/clients/:id/edit" element={<EditClientPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/new" element={<NewContactPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/contacts/:id/edit" element={<EditContactPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<NewTaskPage />} />
        <Route path="/tasks/:id/edit" element={<TaskEditPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<NewInvoicePage />} />
        <Route path="/invoices/:id/edit" element={<InvoiceEditPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/billing/plans" element={<PlansPage />} />
        <Route path="/billing/admin/plans" element={<AdminPlansPage />} />
        <Route path="/billing/subscription" element={<SubscriptionPage />} />
        <Route path="/billing/usage" element={<UsagePage />} />
        <Route path="/billing/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Payment success/failure — outside DashboardLayout */}
      <Route path="/invoices/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/payments/success" element={<PaymentSuccessPage />} />
      <Route path="/payments/failure" element={<PaymentFailurePage />} />

      {/* Documents upload redirect — upload is embedded in /documents */}
      <Route path="/documents/upload" element={<Navigate to="/documents" replace />} />

      {/* Portal — isolated auth surface */}
      <Route path="/portal/login" element={<PortalLoginPage />} />
      <Route element={<PortalLayout />}>
        <Route path="/portal/dashboard" element={<PortalDashboardPage />} />
        <Route path="/portal/documents" element={<PortalDocumentsPage />} />
        <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
        <Route path="/portal/invoices/:id" element={<PortalInvoiceDetailPage />} />
        <Route path="/portal/tasks" element={<PortalTasksPage />} />
      </Route>
      <Route path="/portal/payment-success" element={<PortalPaymentSuccessPage />} />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
