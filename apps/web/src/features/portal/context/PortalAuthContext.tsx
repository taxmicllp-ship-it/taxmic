import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface PortalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  clientId: string;
  firmId: string;
}

interface PortalAuthContextValue {
  portalUser: PortalUser | null;
  portalToken: string | null;
  portalLogin: (token: string, user: PortalUser) => void;
  portalLogout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

function loadFromStorage(): { token: string | null; user: PortalUser | null } {
  try {
    const token = localStorage.getItem('portal_token');
    const raw = localStorage.getItem('portal_user');
    const user = raw ? (JSON.parse(raw) as PortalUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const { token: initialToken, user: initialUser } = loadFromStorage();
  const [portalToken, setPortalToken] = useState<string | null>(initialToken);
  const [portalUser, setPortalUser] = useState<PortalUser | null>(initialUser);
  const navigate = useNavigate();

  const portalLogin = (token: string, user: PortalUser) => {
    localStorage.setItem('portal_token', token);
    localStorage.setItem('portal_user', JSON.stringify(user));
    setPortalToken(token);
    setPortalUser(user);
  };

  const portalLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    setPortalToken(null);
    setPortalUser(null);
    navigate('/portal/login');
  };

  return (
    <PortalAuthContext.Provider value={{ portalUser, portalToken, portalLogin, portalLogout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider');
  return ctx;
}
