import api from '../../../lib/api';

export interface RegisterDto {
  firmName: string;
  firmSlug: string;
  firmEmail: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  firmSlug: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firmId: string;
  firmName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const register = async (data: RegisterDto): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginDto): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const forgotPassword = async (data: { email: string }): Promise<{ message: string; resetToken?: string }> => {
  const response = await api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data: { token: string; password: string }): Promise<void> => {
  await api.post('/auth/reset-password', data);
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export interface AuthMeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firmId: string;
  firmName: string;
  role: string;
}

export const me = async (): Promise<AuthMeResponse> => {
  const response = await api.get<AuthMeResponse>('/auth/me');
  return response.data;
};
