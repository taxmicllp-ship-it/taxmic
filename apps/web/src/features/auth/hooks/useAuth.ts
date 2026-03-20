import { useNavigate } from 'react-router-dom';
import { getToken, removeToken, isAuthenticated } from '../../../lib/auth';
import { logout as logoutApi } from '../api/auth-api';

export function useAuth() {
  const navigate = useNavigate();

  const logoutFn = async () => {
    try {
      await logoutApi();
    } finally {
      removeToken();
      navigate('/login');
    }
  };

  return {
    isAuthenticated: isAuthenticated(),
    token: getToken(),
    logout: logoutFn,
  };
}
