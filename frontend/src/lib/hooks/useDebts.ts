import useSWR, { mutate } from 'swr';
import { api } from '../api';

const fetcher = (url: string) => api.get(url);

export function useDebts() {
  const { data, error, isLoading } = useSWR('/debts', fetcher, {
    revalidateOnFocus: true,
  });

  const createDebt = async (debtData: any) => {
    const res = await api.post('/debts', debtData);
    await mutate('/debts');
    return res;
  };

  const updateDebt = async (id: string, debtData: any) => {
    const res = await api.put(`/debts/${id}`, debtData);
    await mutate('/debts');
    return res;
  };

  const deleteDebt = async (id: string) => {
    const res = await api.delete(`/debts/${id}`);
    await mutate('/debts');
    return res;
  };

  return {
    debtsData: (data as any) || { debts: [], summary: {}, snowball: {}, avalanche: {} },
    isLoading,
    error,
    createDebt,
    updateDebt,
    deleteDebt,
  };
}
