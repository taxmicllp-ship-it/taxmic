import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing-api';
import type { UpdateSubscriptionPayload } from '../types';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => billingApi.getPlans(),
  });
}

// Resolves by firmId from JWT — no ID needed, no localStorage
export function useCurrentSubscription() {
  return useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: () => billingApi.getCurrentSubscription(),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: () => billingApi.getSubscription(id),
    enabled: !!id,
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (planId: string) => billingApi.createCheckoutSession(planId),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}

export function useUpdateSubscription(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSubscriptionPayload) => billingApi.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useCancelSubscription(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['usage'] });
    },
  });
}

export function useSubscriptionHistory(subscriptionId: string) {
  return useQuery({
    queryKey: ['subscription-history', subscriptionId],
    queryFn: () => billingApi.getHistory(subscriptionId),
    enabled: !!subscriptionId,
  });
}
