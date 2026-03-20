import { useState, useEffect } from 'react';
import { billingApi, CreatePlanPayload, UpdatePlanPayload } from '../../features/billing/api/billing-api';
import { Plan } from '../../features/billing/types';
import Button from '../../components/ui/Button';
import InputField from '../../components/form/InputField';
import Label from '../../components/form/Label';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';

interface FormData {
  name: string;
  slug: string;
  description: string;
  price_monthly: string;
  price_annual: string;
  max_users: string;
  max_clients: string;
  max_storage_gb: string;
  stripe_price_id: string;
}

const emptyForm: FormData = {
  name: '',
  slug: '',
  description: '',
  price_monthly: '',
  price_annual: '',
  max_users: '',
  max_clients: '',
  max_storage_gb: '',
  stripe_price_id: '',
};

function planToForm(plan: Plan): FormData {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? '',
    price_monthly: plan.price_monthly,
    price_annual: plan.price_annual,
    max_users: plan.max_users != null ? String(plan.max_users) : '',
    max_clients: plan.max_clients != null ? String(plan.max_clients) : '',
    max_storage_gb: plan.max_storage_gb != null ? String(plan.max_storage_gb) : '',
    stripe_price_id: plan.stripe_price_id ?? '',
  };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billingApi.listAllPlans();
      setPlans(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEdit = (plan: Plan) => {
    setFormData(planToForm(plan));
    setEditingId(plan.id);
    setShowForm(true);
    setError(null);
  };

  const handleCreate = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError(null);
  };

  const handleDeactivate = async (id: string) => {
    setError(null);
    try {
      await billingApi.deactivatePlan(id);
      await fetchPlans();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate plan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CreatePlanPayload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      price_monthly: parseFloat(formData.price_monthly),
      price_annual: parseFloat(formData.price_annual),
      max_users: formData.max_users ? parseInt(formData.max_users, 10) : undefined,
      max_clients: formData.max_clients ? parseInt(formData.max_clients, 10) : undefined,
      max_storage_gb: formData.max_storage_gb ? parseInt(formData.max_storage_gb, 10) : undefined,
      stripe_price_id: formData.stripe_price_id || undefined,
    };

    try {
      if (editingId) {
        const updatePayload: UpdatePlanPayload = payload;
        await billingApi.updatePlan(editingId, updatePayload);
      } else {
        await billingApi.createPlan(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchPlans();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    }
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin — Plans</h1>
        {!showForm && (
          <Button variant="primary" onClick={handleCreate}>
            Create Plan
          </Button>
        )}
      </div>

      {error && (
        <div
          data-testid="error-message"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Edit Plan' : 'New Plan'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <InputField
                data-testid="field-name"
                type="text"
                value={formData.name}
                onChange={handleChange('name')}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <InputField
                data-testid="field-slug"
                type="text"
                value={formData.slug}
                onChange={handleChange('slug')}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <InputField
                data-testid="field-description"
                type="text"
                value={formData.description}
                onChange={handleChange('description')}
              />
            </div>
            <div>
              <Label>Price Monthly</Label>
              <InputField
                data-testid="field-price_monthly"
                type="number"
                step={0.01}
                value={formData.price_monthly}
                onChange={handleChange('price_monthly')}
              />
            </div>
            <div>
              <Label>Price Annual</Label>
              <InputField
                data-testid="field-price_annual"
                type="number"
                step={0.01}
                value={formData.price_annual}
                onChange={handleChange('price_annual')}
              />
            </div>
            <div>
              <Label>Max Users</Label>
              <InputField
                data-testid="field-max_users"
                type="number"
                value={formData.max_users}
                onChange={handleChange('max_users')}
              />
            </div>
            <div>
              <Label>Max Clients</Label>
              <InputField
                data-testid="field-max_clients"
                type="number"
                value={formData.max_clients}
                onChange={handleChange('max_clients')}
              />
            </div>
            <div>
              <Label>Max Storage (GB)</Label>
              <InputField
                data-testid="field-max_storage_gb"
                type="number"
                value={formData.max_storage_gb}
                onChange={handleChange('max_storage_gb')}
              />
            </div>
            <div>
              <Label>Stripe Price ID</Label>
              <InputField
                data-testid="field-stripe_price_id"
                type="text"
                value={formData.stripe_price_id}
                onChange={handleChange('stripe_price_id')}
                placeholder="price_1ABC..."
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button type="submit" variant="primary">
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading plans...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slug</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price/mo</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {plans.map((plan) => (
                <TableRow key={plan.id} data-testid="plan-row">
                  <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">{plan.name}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{plan.slug}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">${plan.price_monthly}</TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`edit-btn-${plan.id}`}
                      onClick={() => handleEdit(plan)}
                    >
                      Edit
                    </Button>
                    {plan.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeactivate(plan.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
