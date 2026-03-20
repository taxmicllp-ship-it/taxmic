import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthPageLayout from '../../components/layout/AuthPageLayout';
import Input from '../../components/form/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { forgotPassword } from '../../features/auth/api/auth-api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const { mutate, isPending, error, isSuccess, data } = useMutation({
    mutationFn: (email: string) => forgotPassword({ email }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(email);
  };

  const errorMessage = error ? (error as any)?.response?.data?.error || 'Something went wrong. Please try again.' : null;

  return (
    <AuthPageLayout>
      <div className="flex flex-col flex-1">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            ← Back to login
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md">Forgot password?</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and we'll send you a reset link.</p>
          </div>
          {isSuccess && (
            <div className="mb-4">
              <Alert variant="success" title="Check your email" message={data?.message || 'If that email exists, a reset link has been sent.'} />
              {data?.resetToken && (
                <p className="mt-2 text-xs text-gray-400 break-all">Dev token: {data.resetToken}</p>
              )}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4">
              <Alert variant="error" title="Error" message={errorMessage} />
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="email">Email <span className="text-error-500">*</span></Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" size="sm" disabled={isPending || isSuccess}>
                {isPending ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
}
