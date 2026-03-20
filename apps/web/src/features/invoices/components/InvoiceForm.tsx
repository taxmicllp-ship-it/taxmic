import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceSchema, InvoiceFormValues } from '../validation/invoice.schema';
import { CreateInvoicePayload } from '../types';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/form/InputField';
import Label from '../../../components/form/Label';
import ClientPicker from '../../../components/form/ClientPicker';

interface InvoiceFormProps {
  onSubmit: (data: CreateInvoicePayload) => void;
  isLoading?: boolean;
  error?: string | null;
  defaultValues?: Partial<InvoiceFormValues>;
  submitLabel?: string;
}

export default function InvoiceForm({ onSubmit, isLoading, error, defaultValues, submitLabel }: InvoiceFormProps) {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: defaultValues ?? {
      client_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_amount: '0.00',
      notes: '',
      items: [{ description: '', quantity: '1', unit_price: '0.00' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');
  const watchedTax = watch('tax_amount');
  const subtotal = (watchedItems ?? []).reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  }, 0);
  const tax = parseFloat(watchedTax ?? '0') || 0;
  const total = subtotal + tax;

  const handleFormSubmit = (data: InvoiceFormValues) => {
    onSubmit({
      client_id: data.client_id as string,
      issue_date: data.issue_date,
      due_date: data.due_date || undefined,
      tax_amount: data.tax_amount,
      notes: data.notes || undefined,
      items: data.items.map((item, idx) => ({ ...item, sort_order: idx })),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15 p-4">
          <p className="text-sm text-error-500">{error}</p>
        </div>
      )}
      <div>
        <Label htmlFor="client_id">Client <span className="text-red-500">*</span></Label>
        <Controller
          name="client_id"
          control={control}
          render={({ field }) => (
            <ClientPicker
              value={field.value ?? null}
              onChange={field.onChange}
              disabled={isLoading}
              error={!!errors.client_id}
            />
          )}
        />
        {errors.client_id && <p className="mt-1.5 text-xs text-error-500">{errors.client_id.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issue_date">Issue Date</Label>
          <InputField id="issue_date" type="date" error={!!errors.issue_date} hint={errors.issue_date?.message} {...(register('issue_date') as any)} />
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <InputField id="due_date" type="date" error={!!errors.due_date} hint={errors.due_date?.message} {...(register('due_date') as any)} />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Line Items <span className="text-red-500">*</span></Label>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', quantity: '1', unit_price: '0.00' })}>+ Add Item</Button>
        </div>
        {errors.items && !Array.isArray(errors.items) && (
          <p className="mb-2 text-sm text-error-500">{errors.items.message}</p>
        )}
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id}>
              <div className="flex gap-2 items-center">
                <input className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Description" {...register(`items.${idx}.description`)} />
                <input className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Qty" {...register(`items.${idx}.quantity`)} />
                <input className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Unit Price" {...register(`items.${idx}.unit_price`)} />
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-700 text-sm px-1" aria-label="Remove item">✕</button>
                )}
              </div>
              {errors.items?.[idx] && (
                <p className="mt-1 text-xs text-error-500">
                  {errors.items[idx]?.description?.message || errors.items[idx]?.quantity?.message || errors.items[idx]?.unit_price?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="tax_amount">Tax Amount</Label>
        <InputField id="tax_amount" placeholder="0.00" {...(register('tax_amount') as any)} />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea id="notes" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Optional notes..." {...register('notes')} />
      </div>
      <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
        <div className="mt-1 flex justify-between font-semibold text-gray-900 dark:text-white"><span>Total</span><span>${total.toFixed(2)}</span></div>
        <p className="mt-1 text-xs text-gray-400">Preview only — server recalculates totals</p>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : (submitLabel ?? 'Create Invoice')}
      </Button>
    </form>
  );
}
