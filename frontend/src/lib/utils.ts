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
  const iconStr = (iconName || '').toLowerCase();
  const nameStr = (catName || '').toLowerCase();

  // If icon is already a clean emoji (e.g. 🛒, 🥛, 🍿), render it directly!
  if (iconName && !iconName.includes('.png') && !iconName.includes('.svg') && !iconName.includes('/') && iconName.length <= 4) {
    return iconName;
  }

  // Comprehensive Cashew PNG & Name to Emoji Mapping
  if (iconStr.includes('house') || nameStr.includes('house') || nameStr.includes('rent') || nameStr.includes('home')) return '🏠';
  if (iconStr.includes('bread') || nameStr.includes('bakery') || nameStr.includes('bread')) return '🍞';
  if (iconStr.includes('chart') || nameStr.includes('balance') || nameStr.includes('correction')) return '📊';
  if (iconStr.includes('balloon') || nameStr.includes('party') || nameStr.includes('birthday') || nameStr.includes('celebration')) return '🎈';
  if (iconStr.includes('dollar') || iconStr.includes('coin') || nameStr.includes('bonus') || nameStr.includes('cash') || nameStr.includes('salary') || nameStr.includes('income') || nameStr.includes('earn')) return '💰';
  if (iconStr.includes('cloth') || nameStr.includes('cloth') || nameStr.includes('fashion') || nameStr.includes('hanger') || nameStr.includes('apparel') || nameStr.includes('wear')) return '👔';
  if (iconStr.includes('computer') || iconStr.includes('desktop') || nameStr.includes('computer') || nameStr.includes('tech') || nameStr.includes('laptop') || nameStr.includes('software')) return '💻';
  if (iconStr.includes('cutlery') || nameStr.includes('dining') || nameStr.includes('food') || nameStr.includes('restaurant') || nameStr.includes('lunch') || nameStr.includes('dinner')) return '🍽️';
  if (iconStr.includes('car') || nameStr.includes('transport') || nameStr.includes('fuel') || nameStr.includes('vehicle') || nameStr.includes('petrol') || nameStr.includes('gas') || nameStr.includes('uber') || nameStr.includes('cab')) return '🚗';
  if (iconStr.includes('gift') || nameStr.includes('gift') || nameStr.includes('present')) return '🎁';
  if (iconStr.includes('medical') || iconStr.includes('hospital') || nameStr.includes('medical') || nameStr.includes('health') || nameStr.includes('doctor') || nameStr.includes('pharma') || nameStr.includes('medicine')) return '💊';
  if (iconStr.includes('grocery') || nameStr.includes('grocery') || nameStr.includes('groceries') || nameStr.includes('supermarket')) return '🛒';
  if (iconStr.includes('snack') || nameStr.includes('snack') || nameStr.includes('fast food') || nameStr.includes('coffee') || nameStr.includes('tea')) return '🍿';
  if (iconStr.includes('milk') || nameStr.includes('milk') || nameStr.includes('dairy')) return '🥛';
  if (iconStr.includes('shop') || nameStr.includes('shop') || nameStr.includes('store') || nameStr.includes('mall')) return '🛍️';
  if (iconStr.includes('phone') || nameStr.includes('mobile') || nameStr.includes('bill') || nameStr.includes('recharge') || nameStr.includes('internet') || nameStr.includes('wifi')) return '📱';
  if (iconStr.includes('movie') || nameStr.includes('film') || nameStr.includes('cinema') || nameStr.includes('entertainment') || nameStr.includes('netflix')) return '🎬';
  if (iconStr.includes('book') || nameStr.includes('education') || nameStr.includes('study') || nameStr.includes('tuition') || nameStr.includes('school')) return '📚';
  if (iconStr.includes('plane') || nameStr.includes('travel') || nameStr.includes('flight') || nameStr.includes('vacation') || nameStr.includes('hotel')) return '✈️';
  if (iconStr.includes('heart') || nameStr.includes('life') || nameStr.includes('personal')) return '❤️';
  if (iconStr.includes('fruit') || nameStr.includes('fruit') || nameStr.includes('dryfruit')) return '🥜';
  if (iconStr.includes('electric') || nameStr.includes('power') || nameStr.includes('electricity')) return '⚡';
  if (iconStr.includes('water') || nameStr.includes('utility')) return '🚰';
  if (iconStr.includes('sub') || nameStr.includes('subscription') || nameStr.includes('membership')) return '💳';
  if (iconStr.includes('invest') || nameStr.includes('stock') || nameStr.includes('crypto') || nameStr.includes('mutual')) return '📈';
  if (iconStr.includes('pet') || nameStr.includes('dog') || nameStr.includes('cat')) return '🐾';
  if (iconStr.includes('gym') || nameStr.includes('fitness') || nameStr.includes('workout')) return '🏋️';

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
