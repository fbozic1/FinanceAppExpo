import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type FinanceStore = {
  salary: number;
  currency: string;
  name: string;
  lastCategory: string;
  settingsLoaded: boolean;
  setSalary: (salary: number) => void;
  setCurrency: (currency: string) => void;
  setName: (name: string) => void;
  setLastCategory: (cat: string) => void;
  loadSettings: () => Promise<void>;
};

export const useFinanceStore = create<FinanceStore>((set) => ({
  salary: 0,
  currency: 'EUR',
  name: '',
  lastCategory: '',
  settingsLoaded: false,

  loadSettings: async () => {
    const [salaryStr, currency, name, lastCategory] = await Promise.all([
      SecureStore.getItemAsync('salary'),
      SecureStore.getItemAsync('currency'),
      SecureStore.getItemAsync('name'),
      SecureStore.getItemAsync('lastCategory'),
    ]);
    set({
      salary: salaryStr ? parseFloat(salaryStr) : 0,
      currency: currency ?? 'EUR',
      name: name ?? '',
      lastCategory: lastCategory ?? '',
      settingsLoaded: true,
    });
  },

  setSalary: (salary) => {
    SecureStore.setItemAsync('salary', salary.toString());
    set({ salary });
  },

  setCurrency: (currency) => {
    SecureStore.setItemAsync('currency', currency);
    set({ currency });
  },

  setName: (name) => {
    SecureStore.setItemAsync('name', name);
    set({ name });
  },

  setLastCategory: (cat) => {
    SecureStore.setItemAsync('lastCategory', cat);
    set({ lastCategory: cat });
  },
}));

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
