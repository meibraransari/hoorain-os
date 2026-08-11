import useSWR, { mutate } from 'swr';
import { api } from '../api';

const fetcher = (url: string) => api.get(url);

export function useAccounts() {
  const { data, error, isLoading } = useSWR('/accounts', fetcher, { revalidateOnFocus: true });

  const createAccount = async (accountData: any) => {
    const res = await api.post('/accounts', accountData);
    await mutate('/accounts');
    return res;
  };

  const updateAccount = async (id: string, accountData: any) => {
    const res = await api.put(`/accounts/${id}`, accountData);
    await mutate('/accounts');
    return res;
  };

  const deleteAccount = async (id: string) => {
    const res = await api.delete(`/accounts/${id}`);
    await mutate('/accounts');
    return res;
  };

  return {
    accounts: Array.isArray(data) ? data : [],
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}

export function useAccountTypes() {
  const { data, error, isLoading } = useSWR('/account-types', fetcher, { revalidateOnFocus: true });

  const createAccountType = async (typeData: any) => {
    const res = await api.post('/account-types', typeData);
    await mutate('/account-types');
    return res;
  };

  const updateAccountType = async (id: string, typeData: any) => {
    const res = await api.put(`/account-types/${id}`, typeData);
    await mutate('/account-types');
    return res;
  };

  const deleteAccountType = async (id: string) => {
    const res = await api.delete(`/account-types/${id}`);
    await mutate('/account-types');
    return res;
  };

  const accountTypes = Array.isArray(data) ? data : [
    { id: '1', code: 'checking', name: 'Checking / Bank', color: '#3f51b5', isDefault: true },
    { id: '2', code: 'savings', name: 'Savings', color: '#4caf50', isDefault: true },
    { id: '3', code: 'credit_card', name: 'Credit Card', color: '#ff9800', isDefault: true },
    { id: '4', code: 'cash', name: 'Cash / Wallet', color: '#e91e63', isDefault: true },
    { id: '5', code: 'investment', name: 'Investment', color: '#9c27b0', isDefault: true },
    { id: '6', code: 'loan', name: 'Loan', color: '#607d8b', isDefault: true },
    { id: '7', code: 'crypto', name: 'Cryptocurrency', color: '#00bcd4', isDefault: true },
  ];

  return {
    accountTypes,
    isLoading,
    error,
    createAccountType,
    updateAccountType,
    deleteAccountType,
  };
}

export function useTransactions(filters?: Record<string, any>) {
  const cleanFilters: Record<string, string> = {};
  if (filters) {
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== '' && val !== 'undefined') {
        cleanFilters[key] = String(val);
      }
    });
  }

  const queryParams = new URLSearchParams(cleanFilters).toString();
  const key = queryParams ? `/transactions?${queryParams}` : '/transactions';
  const { data, error, isLoading } = useSWR(key, fetcher, { revalidateOnFocus: true });

  const createTransaction = async (txData: any) => {
    const res = await api.post('/transactions', txData);
    await mutate((k) => typeof k === 'string' && k.startsWith('/transactions'));
    await mutate('/accounts');
    return res;
  };

  const updateTransaction = async (id: string, txData: any) => {
    const res = await api.put(`/transactions/${id}`, txData);
    await mutate((k) => typeof k === 'string' && k.startsWith('/transactions'));
    await mutate('/accounts');
    return res;
  };

  const deleteTransaction = async (id: string) => {
    const res = await api.delete(`/transactions/${id}`);
    await mutate((k) => typeof k === 'string' && k.startsWith('/transactions'));
    await mutate('/accounts');
    return res;
  };

  return {
    transactions: (data as any)?.items ?? (data as any)?.data ?? (Array.isArray(data) ? data : []),
    total: (data as any)?.meta?.total ?? 0,
    summary: (data as any)?.summary ?? null,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR('/categories', fetcher);

  const createCategory = async (catData: any) => {
    const res = await api.post('/categories', catData);
    await mutate('/categories');
    return res;
  };

  const updateCategory = async (id: string, catData: any) => {
    const res = await api.put(`/categories/${id}`, catData);
    await mutate('/categories');
    return res;
  };

  const deleteCategory = async (id: string) => {
    const res = await api.delete(`/categories/${id}`);
    await mutate('/categories');
    return res;
  };

  return {
    categories: Array.isArray(data) ? data : [],
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useBudgets() {
  const { data, error, isLoading } = useSWR('/budgets', fetcher);

  const createBudget = async (bData: any) => {
    const res = await api.post('/budgets', bData);
    await mutate('/budgets');
    return res;
  };

  const updateBudget = async (id: string, bData: any) => {
    const res = await api.put(`/budgets/${id}`, bData);
    await mutate('/budgets');
    return res;
  };

  const deleteBudget = async (id: string) => {
    const res = await api.delete(`/budgets/${id}`);
    await mutate('/budgets');
    return res;
  };

  return {
    budgets: Array.isArray(data) ? data : [],
    isLoading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}

export function useGoals() {
  const { data, error, isLoading } = useSWR('/goals', fetcher);

  const createGoal = async (gData: any) => {
    const res = await api.post('/goals', gData);
    await mutate('/goals');
    return res;
  };

  const updateGoal = async (id: string, gData: any) => {
    const res = await api.put(`/goals/${id}`, gData);
    await mutate('/goals');
    return res;
  };

  const contributeGoal = async (id: string, amount: number) => {
    const res = await api.post(`/goals/${id}/contribute`, { amount });
    await mutate('/goals');
    return res;
  };

  const deleteGoal = async (id: string) => {
    const res = await api.delete(`/goals/${id}`);
    await mutate('/goals');
    return res;
  };

  return {
    goals: Array.isArray(data) ? data : [],
    isLoading,
    error,
    createGoal,
    updateGoal,
    contributeGoal,
    deleteGoal,
  };
}

export function useCashewImport() {
  const uploadCashewFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('financeos_access_token') : null;
    const res = await fetch('/api/v1/import/cashew', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }
    const json = await res.json();
    await mutate('/accounts');
    await mutate((k) => typeof k === 'string' && k.startsWith('/transactions'));
    await mutate('/categories');
    await mutate('/budgets');
    await mutate('/goals');
    return json.data ?? json;
  };

  return { uploadCashewFile };
}

export function useProfitLoss() {
  const { data, error, isLoading } = useSWR('/reports/profit-loss', fetcher, { revalidateOnFocus: true });
  return {
    profitLoss: (data as any) || null,
    isLoading,
    error,
  };
}

export function useCreditUtilization() {
  const { data, error, isLoading } = useSWR('/reports/credit-utilization', fetcher, { revalidateOnFocus: true });
  return {
    creditUtilization: (data as any) || null,
    isLoading,
    error,
  };
}

