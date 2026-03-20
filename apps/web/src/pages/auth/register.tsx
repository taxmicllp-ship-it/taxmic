import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthPageLayout from '../../components/layout/AuthPageLayout';
import Input from '../../components/form/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useRegister } from '../../features/auth/hooks/useRegister';
import { RegisterSchema, RegisterFormValues } from '../../features/auth/validation/auth.schema';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function RegisterPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutate: registerMutate, isPending } = useRegister();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = ({ confirmPassword: _, ...data }: RegisterFormValues) => {
    setApiError(null);
    registerMutate(data, {
      onError: (err) => setApiError(getErrorMessage(err)),
    });
  };

  return (
    <AuthPageLayout>
      <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
        <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            ← Back to login
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Create your account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Register your firm to get started</p>
          </div>
          {apiError && (
            <div className="mb-4">
              <Alert variant="error" title="Registration failed" message={apiError} />
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <Label htmlFor="firmName">Firm Name <span className="text-error-500">*</span></Label>
                <Input id="firmName" placeholder="Acme Accounting" error={!!errors.firmName} hint={errors.firmName?.message} {...register('firmName')} />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firmSlug">Firm Slug <span className="text-error-500">*</span></Label>
                  <Input id="firmSlug" placeholder="acme-accounting" error={!!errors.firmSlug} hint={errors.firmSlug?.message} {...register('firmSlug')} />
                </div>
                <div>
                  <Label htmlFor="firmEmail">Firm Email <span className="text-error-500">*</span></Label>
                  <Input id="firmEmail" type="email" placeholder="contact@acme.com" error={!!errors.firmEmail} hint={errors.firmEmail?.message} {...register('firmEmail')} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name <span className="text-error-500">*</span></Label>
                  <Input id="firstName" placeholder="Jane" error={!!errors.firstName} hint={errors.firstName?.message} {...register('firstName')} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name <span className="text-error-500">*</span></Label>
                  <Input id="lastName" placeholder="Doe" error={!!errors.lastName} hint={errors.lastName?.message} {...register('lastName')} />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Your Email <span className="text-error-500">*</span></Label>
                <Input id="email" type="email" placeholder="jane@acme.com" error={!!errors.email} hint={errors.email?.message} {...register('email')} />
              </div>
              <div>
                <Label htmlFor="password">Password <span className="text-error-500">*</span></Label>
                <Input id="password" type="password" placeholder="Min 8 characters" error={!!errors.password} hint={errors.password?.message} {...register('password')} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-error-500">*</span></Label>
                <Input id="confirmPassword" type="password" placeholder="Repeat password" error={!!errors.confirmPassword} hint={errors.confirmPassword?.message} {...register('confirmPassword')} />
              </div>
              <Button type="submit" className="w-full" size="sm" disabled={isPending}>
                {isPending ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
}
