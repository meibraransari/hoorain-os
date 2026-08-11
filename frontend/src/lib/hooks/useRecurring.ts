import useSWR, { mutate } from 'swr';
import { api } from '../api';

const fetcher = (url: string) => api.get(url);

export function useRecurring() {
  const { data, error, isLoading } = useSWR('/recurring-transactions', fetcher, {
    revalidateOnFocus: true,
  });

  const createRecurring = async (recurringData: any) => {
    const res = await api.post('/recurring-transactions', recurringData);
    await mutate('/recurring-transactions');
    return res;
  };

  const updateRecurring = async (id: string, recurringData: any) => {
    const res = await api.put(`/recurring-transactions/${id}`, recurringData);
    await mutate('/recurring-transactions');
    return res;
  };

  const deleteRecurring = async (id: string) => {
    const res = await api.delete(`/recurring-transactions/${id}`);
    await mutate('/recurring-transactions');
    return res;
  };

  const payBill = async (id: string, payData: { accountId?: string; date?: string; notes?: string }) => {
    const res = await api.post(`/recurring-transactions/${id}/pay`, payData);
    await mutate('/recurring-transactions');
    await mutate('/accounts');
    await mutate((k) => typeof k === 'string' && k.startsWith('/transactions'));
    return res;
  };

  return {
    recurringItems: Array.isArray(data) ? data : [],
    isLoading,
    error,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    payBill,
  };
}
