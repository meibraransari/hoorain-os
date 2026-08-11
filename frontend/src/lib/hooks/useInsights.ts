import useSWR from 'swr';
import { api } from '../api';

const fetcher = (url: string) => api.get(url);

export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR('/insights/health-score', fetcher, {
    revalidateOnFocus: true,
  });

  const payload = (data as any)?.data ?? (data as any) ?? null;

  return {
    insightsData: payload,
    isLoading,
    error,
    refreshInsights: mutate,
  };
}
