'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface AppSettings {
  defaultCurrency: string;
  dateFormat: string;
  numberFormat: string;
  showNetWorth: boolean;
  showCreditDebt: boolean;
  showSpendingGraph: boolean;
  showPieChart: boolean;
  showObjectives: boolean;
  removeZeroTransactionEntries: boolean;
  automaticallyPayUpcoming: boolean;
  use24HourFormat: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'standard',
  showNetWorth: true,
  showCreditDebt: true,
  showSpendingGraph: true,
  showPieChart: true,
  showObjectives: false,
  removeZeroTransactionEntries: false,
  automaticallyPayUpcoming: true,
  use24HourFormat: 'system',
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      // 1. Read from localStorage as immediate fallback
      const localCurrency = typeof window !== 'undefined' ? localStorage.getItem('defaultCurrency') : null;
      const localDateFormat = typeof window !== 'undefined' ? localStorage.getItem('dateFormat') : null;
      const localNumFormat = typeof window !== 'undefined' ? localStorage.getItem('numberFormat') : null;

      // 2. Fetch from backend API
      const apiSettings: any = await api.get('/settings').catch(() => ({}));
      
      const merged: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...(localCurrency ? { defaultCurrency: localCurrency } : {}),
        ...(localDateFormat ? { dateFormat: localDateFormat } : {}),
        ...(localNumFormat ? { numberFormat: localNumFormat } : {}),
        ...(typeof apiSettings === 'object' && apiSettings !== null ? apiSettings : {}),
      };

      setSettings(merged);
    } catch (err) {
      console.warn('Failed to load backend settings, using defaults');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      if (newSettings.defaultCurrency) localStorage.setItem('defaultCurrency', newSettings.defaultCurrency);
      if (newSettings.dateFormat) localStorage.setItem('dateFormat', newSettings.dateFormat);
      if (newSettings.numberFormat) localStorage.setItem('numberFormat', newSettings.numberFormat);
    }

    // Save to backend API
    try {
      await api.put('/settings', updated);
    } catch (err) {
      console.error('Failed to persist settings to API', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
