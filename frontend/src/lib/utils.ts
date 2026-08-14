import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: any, currency: string = 'INR') {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  const safeNum = isNaN(num) ? 0 : num;
  const safeCurr = currency && typeof currency === 'string' && currency.length === 3 ? currency.toUpperCase() : 'INR';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: safeCurr,
      maximumFractionDigits: 2,
    }).format(safeNum);
  } catch (e) {
    return `₹${safeNum.toFixed(2)}`;
  }
}

export function renderCategoryIcon(iconName: string | undefined, catName: string = '') {
  if (iconName && !iconName.includes('.png') && !iconName.includes('.svg') && !iconName.includes('/') && iconName.length <= 4) {
    return iconName;
  }
  return '🏷️';
}

export function renderAccountIcon(name: string = '', type: string = '') {
  const n = (name || '').toLowerCase();
  const t = (type || '').toLowerCase();
  if (n.includes('icici')) return '🏦';
  if (n.includes('hdfc')) return '💳';
  if (n.includes('saving')) return '🐷';
  if (n.includes('kotak')) return '🏛️';
  if (n.includes('bupg')) return '🏬';
  if (n.includes('emergency')) return '⚡';
  if (n.includes('cash')) return '💵';
  if (n.includes('wallet')) return '👛';
  if (t.includes('bank')) return '🏦';
  if (t.includes('saving')) return '🐷';
  if (t.includes('cash')) return '💵';
  if (t.includes('card')) return '💳';
  return '💰';
}
