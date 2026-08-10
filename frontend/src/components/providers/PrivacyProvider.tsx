'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCurrency as rawFormatCurrency } from '@/lib/utils';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
  formatPrivateCurrency: (amount: any, currency?: string) => string;
  formatPrivateNumber: (val: any, suffix?: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivate: true,
  togglePrivacy: () => {},
  formatPrivateCurrency: () => '₹••••••',
  formatPrivateNumber: () => '••••',
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  // Default to hidden (true)
  const [isPrivate, setIsPrivate] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hoorain_privacy_hide');
      if (stored !== null) {
        setIsPrivate(stored === 'true');
      }
    }
  }, []);

  const togglePrivacy = () => {
    setIsPrivate((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hoorain_privacy_hide', String(next));
      }
      return next;
    });
  };

  const formatPrivateCurrency = (amount: any, currency: string = 'INR') => {
    if (isPrivate) {
      const currSymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
      return `${currSymbol}••••••`;
    }
    return rawFormatCurrency(amount, currency);
  };

  const formatPrivateNumber = (val: any, suffix: string = '') => {
    if (isPrivate) {
      return `••••${suffix}`;
    }
    return `${val}${suffix}`;
  };

  return (
    <PrivacyContext.Provider
      value={{
        isPrivate,
        togglePrivacy,
        formatPrivateCurrency,
        formatPrivateNumber,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
