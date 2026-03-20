import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { DashboardSummary } from '../types';

export interface DashboardDateRange {
  start: Date;
  end: Date;
}

export function useDashboardSummary(range?: DashboardDateRange) {
  const params: Record<string, string> = {};
  if (range) {
    params.start_date = range.start.toISOString().split('T')[0];
    params.end_date   = range.end.toISOString().split('T')[0];
  }

  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary', params.start_date, params.end_date],
    queryFn: () => api.get('/dashboard/summary', { params }).then(r => r.data),
  });
}
