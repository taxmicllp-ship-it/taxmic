import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthPageLayout from '../../components/layout/AuthPageLayout';
import Input from '../../components/form/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { usePortalAuth } from '../../features/portal/context/PortalAuthContext';
import { portalApiClient } from '../../features/portal/api/portal-api';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function PortalLoginPage() {
  const { portalLogin } = usePortalAuth();
  const navigate = useNavigate();
  const [firmSlug, setFirmSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await portalApiClient.login({ firmSlug, email, password });
      portalLogin(token, user);
      navigate('/portal/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md">
              Client Portal
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to access your documents, invoices, and tasks
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert variant="error" title="Login failed" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label htmlFor="firmSlug">Firm Slug <span className="text-error-500">*</span></Label>
                <Input
                  id="firmSlug"
                  placeholder="your-firm-slug"
                  value={firmSlug}
                  onChange={(e) => setFirmSlug(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email <span className="text-error-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password <span className="text-error-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" size="sm" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthPageLayout>
  );
}
