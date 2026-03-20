import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { ThemeProvider } from './context/ThemeContext';
import { PortalAuthProvider } from './features/portal/context/PortalAuthContext';
import App from './App';
import './styles/globals.css';

// Init Sentry before rendering
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: true,
  });
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <PortalAuthProvider>
              <App />
            </PortalAuthProvider>
          </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
