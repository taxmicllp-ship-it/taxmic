import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, LoginDto, AuthResponse } from '../api/auth-api';
import { setToken } from '../../../lib/auth';

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginDto) => login(data),
    onSuccess: (result: AuthResponse) => {
      setToken(result.token);
      navigate('/dashboard');
    },
  });
}
