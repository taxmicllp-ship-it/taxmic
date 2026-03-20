import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as authApi from '../../features/auth/api/auth-api';
import api from '../../lib/api';
import { getErrorMessage } from '../../lib/getErrorMessage';
import InputField from '../../components/form/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

// ── Change Password schema ───────────────────────────────────────
const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Required'),
    new_password: z.string().min(8, 'At least 8 characters'),
    confirm_new_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_new_password, {
    message: 'Passwords do not match',
    path: ['confirm_new_password'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// ── ChangePasswordForm ───────────────────────────────────────────
function ChangePasswordForm() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.post('/auth/change-password', data),
    onSuccess: () => {
      setSuccessMsg('Password updated successfully.');
      setErrorMsg(null);
      reset();
    },
    onError: (err: unknown) => {
      setErrorMsg(getErrorMessage(err));
      setSuccessMsg(null);
    },
  });

  function onSubmit(values: ChangePasswordFormValues) {
    setSuccessMsg(null);
    setErrorMsg(null);
    mutate({
      current_password: values.current_password,
      new_password: values.new_password,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="current_password">Current Password</Label>
        <InputField
          id="current_password"
          type="password"
          error={!!errors.current_password}
          hint={errors.current_password?.message}
          {...register('current_password')}
        />
      </div>

      <div>
        <Label htmlFor="new_password">New Password</Label>
        <InputField
          id="new_password"
          type="password"
          error={!!errors.new_password}
          hint={errors.new_password?.message}
          {...register('new_password')}
        />
      </div>

      <div>
        <Label htmlFor="confirm_new_password">Confirm New Password</Label>
        <InputField
          id="confirm_new_password"
          type="password"
          error={!!errors.confirm_new_password}
          hint={errors.confirm_new_password?.message}
          {...register('confirm_new_password')}
        />
      </div>

      {successMsg && (
        <Alert variant="success" title="Success" message={successMsg} />
      )}
      {errorMsg && (
        <Alert variant="error" title="Error" message={errorMsg} />
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Password'}
      </Button>
    </form>
  );
}

// ── SettingsPage ─────────────────────────────────────────────────
export default function SettingsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Firm Profile */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Firm Profile</h2>

        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        )}
        {isError && (
          <Alert
            variant="error"
            title="Failed to load profile"
            message={getErrorMessage(error)}
          />
        )}
        {data && (
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Firm Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{data.firmName}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* User Profile */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">User Profile</h2>

        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        )}
        {isError && (
          <Alert
            variant="error"
            title="Failed to load profile"
            message={getErrorMessage(error)}
          />
        )}
        {data && (
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {data.firstName} {data.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{data.email}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* Change Password */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
