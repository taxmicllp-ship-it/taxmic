export const getToken = (): string | null => localStorage.getItem('auth_token');
export const setToken = (token: string): void => localStorage.setItem('auth_token', token);
export const removeToken = (): void => localStorage.removeItem('auth_token');
export const isAuthenticated = (): boolean => !!getToken();

export const getTokenPayload = (): Record<string, unknown> | null => {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const getRole = (): string | null => {
  const payload = getTokenPayload();
  return (payload?.role as string) ?? null;
};
