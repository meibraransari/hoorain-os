import useSWR from 'swr';
import { api } from '../api';

const fetcher = (url: string) => api.get(url);

export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR('/insights/health-score', fetcher, {
    revalidateOnFocus: true,
  });

  return {
    insightsData: (data as any) || null,
    isLoading,
    error,
    refreshInsights: mutate,
  };
}
