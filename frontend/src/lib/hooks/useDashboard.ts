'use client';

import { useState, useEffect } from 'react';

export function useDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Dummy fetch
    const timer = setTimeout(() => {
      setData({
        stats: {
          netWorth: 125430.50, netWorthTrend: 2.4,
          monthlyIncome: 8400.00, incomeTrend: 5.1,
          monthlyExpense: 3240.20, expenseTrend: -1.2,
          savingsRate: 61.4, savingsTrend: 3.2
        },
        chartData: [
          { name: 'Jan', income: 8200, expense: 3100 },
          { name: 'Feb', income: 8200, expense: 3400 },
          { name: 'Mar', income: 8500, expense: 2900 },
          { name: 'Apr', income: 8400, expense: 3800 },
          { name: 'May', income: 8400, expense: 3100 },
          { name: 'Jun', income: 8400, expense: 3240 }
        ],
        categoryData: [
          { name: 'Housing', value: 1500, color: '#6c63ff' },
          { name: 'Food', value: 600, color: '#10d88a' },
          { name: 'Transport', value: 400, color: '#ffb84d' },
          { name: 'Entertainment', value: 300, color: '#ff4d6d' },
          { name: 'Utilities', value: 440, color: '#4db8ff' }
        ],
        recentTransactions: [
          { id: '1', title: 'Whole Foods Market', amount: -124.50, date: new Date().toISOString(), category: 'Food', type: 'expense', account: 'Chase Checking' },
          { id: '2', title: 'Salary', amount: 4200.00, date: new Date(Date.now() - 86400000 * 2).toISOString(), category: 'Income', type: 'income', account: 'Chase Checking' },
          { id: '3', title: 'Netflix', amount: -15.99, date: new Date(Date.now() - 86400000 * 3).toISOString(), category: 'Entertainment', type: 'expense', account: 'Amex Platinum' },
          { id: '4', title: 'Uber', amount: -24.20, date: new Date(Date.now() - 86400000 * 4).toISOString(), category: 'Transport', type: 'expense', account: 'Amex Platinum' },
        ],
        budgets: [
          { id: '1', name: 'Food & Dining', spent: 600, limit: 800, category: 'Food' },
          { id: '2', name: 'Entertainment', spent: 300, limit: 300, category: 'Entertainment' },
          { id: '3', name: 'Shopping', spent: 150, limit: 400, category: 'Shopping' }
        ]
      });
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading, error };
}
