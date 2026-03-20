import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import AuthPageLayout from '../../components/layout/AuthPageLayout';
import InputField from '../../components/form/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { resetPassword } from '../../features/auth/api/auth-api';
import { getErrorMessage } from '../../lib/getErrorMessage';

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      resetPassword({ token, password: values.password }),
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    mutate(values);
  };

  const errorMessage = error ? getErrorMessage(error) : null;

  return (
    <AuthPageLayout>
      <div className="flex flex-col flex-1">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← Back to login
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-bold text-gray-900 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset your password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your new password below.
            </p>
          </div>

          {!token && (
            <Alert
              variant="error"
              title="Invalid reset link"
              message="Invalid or missing reset link. Please request a new password reset."
            />
          )}

          {token && isSuccess && (
            <Alert
              variant="success"
              title="Password reset"
              message="Your password has been reset successfully."
              showLink
              linkHref="/login"
              linkText="Sign in to your account"
            />
          )}

          {errorMessage && (
            <div className="mb-4">
              <Alert variant="error" title="Error" message={errorMessage} />
            </div>
          )}

          {token && !isSuccess && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="password">
                    New Password <span className="text-error-500">*</span>
                  </Label>
                  <InputField
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    error={!!errors.password}
                    hint={errors.password?.message}
                    {...register('password')}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-error-500">*</span>
                  </Label>
                  <InputField
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    error={!!errors.confirmPassword}
                    hint={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>
                <Button type="submit" className="w-full" size="sm" disabled={isPending}>
                  {isPending ? 'Resetting...' : 'Reset password'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
}
