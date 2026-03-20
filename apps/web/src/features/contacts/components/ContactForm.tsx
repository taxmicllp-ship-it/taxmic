import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Contact } from '../types';
import { ContactSchema, ContactFormValues } from '../validation/contact.schema';
import Input from '../../../components/form/InputField';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/Button';

interface Props {
  initial?: Partial<Contact>;
  onSubmit: (data: ContactFormValues) => void;
  isPending?: boolean;
  error?: string | null;
  onCancel?: () => void;
}

const ContactForm: React.FC<Props> = ({ initial = {}, onSubmit, isPending, error, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: initial.name ?? '',
      email: initial.email ?? '',
      phone: initial.phone ?? '',
      title: initial.title ?? '',
      notes: initial.notes ?? '',
    },
  });

  const handleFormSubmit = (data: ContactFormValues) => {
    onSubmit({
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      title: data.title || undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15 p-4">
          <p className="text-sm text-error-500">{error}</p>
        </div>
      )}
      <div>
        <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
        <Input id="name" placeholder="Contact name" error={!!errors.name} hint={errors.name?.message} {...register('name')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="contact@example.com" error={!!errors.email} hint={errors.email?.message} {...register('email')} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+1 555 000 0000" {...register('phone')} />
        </div>
      </div>
      <div>
        <Label htmlFor="title">Title / Position</Label>
        <Input id="title" placeholder="CFO, Owner, etc." {...register('title')} />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea id="notes" rows={3} placeholder="Internal notes..." {...register('notes')} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Saving...' : 'Save Contact'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
};

export default ContactForm;
