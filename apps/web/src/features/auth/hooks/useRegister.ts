import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { register, RegisterDto, AuthResponse } from '../api/auth-api';
import { setToken } from '../../../lib/auth';

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterDto) => register(data),
    onSuccess: (result: AuthResponse) => {
      setToken(result.token);
      navigate('/dashboard');
    },
  });
}
