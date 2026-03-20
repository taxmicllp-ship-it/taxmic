import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthPageLayout from '../../components/layout/AuthPageLayout';
import Input from '../../components/form/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useLogin } from '../../features/auth/hooks/useLogin';
import { LoginSchema, LoginFormValues } from '../../features/auth/validation/auth.schema';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function LoginPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutate: loginMutate, isPending } = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    setApiError(null);
    loginMutate(data, {
      onError: (err) => setApiError(getErrorMessage(err)),
    });
  };

  return (
    <AuthPageLayout>
      <div className="flex flex-col flex-1">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link to="/register" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            ← Back to register
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md">Welcome back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
          </div>
          {apiError && (
            <div className="mb-4">
              <Alert variant="error" title="Login failed" message={apiError} />
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="firmSlug">Firm Slug <span className="text-error-500">*</span></Label>
                <Input id="firmSlug" placeholder="your-firm-slug" error={!!errors.firmSlug} hint={errors.firmSlug?.message} {...register('firmSlug')} />
              </div>
              <div>
                <Label htmlFor="email">Email <span className="text-error-500">*</span></Label>
                <Input id="email" type="email" placeholder="you@example.com" error={!!errors.email} hint={errors.email?.message} {...register('email')} />
              </div>
              <div>
                <Label htmlFor="password">Password <span className="text-error-500">*</span></Label>
                <Input id="password" type="password" placeholder="Enter your password" error={!!errors.password} hint={errors.password?.message} {...register('password')} />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full" size="sm" disabled={isPending}>
                {isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
}
