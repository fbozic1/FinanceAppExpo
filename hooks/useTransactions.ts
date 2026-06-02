import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  type Transaction,
  type NewTransaction,
  getTransactionsByMonth,
  getRecentTransactions,
  getAllTimeTotals,
  insertTransaction,
  deleteTransaction,
  stopRecurringTransaction,
  syncRecurringTransactions,
  syncSalaryTransaction,
} from '@/db/transactions';
import { useFinanceStore } from '@/store/useFinanceStore';

export function useTransactions(year: number, month: number) {
  const db = useSQLiteContext();
  const { salary } = useFinanceStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      await syncRecurringTransactions(db, year, month);
      const now = new Date();
      if (salary > 0 && year === now.getFullYear() && month === now.getMonth() + 1) {
        await syncSalaryTransaction(db, year, month, salary);
      }
      const data = await getTransactionsByMonth(db, year, month);
      setTransactions(data);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [db, year, month, salary]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const add = useCallback(
    async (tx: NewTransaction) => {
      await insertTransaction(db, tx);
      await load();
    },
    [db, load]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteTransaction(db, id);
      await load();
    },
    [db, load]
  );

  const stopRecurring = useCallback(
    async (title: string, category: string, type: string) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      await stopRecurringTransaction(db, title, category, type, `${year}-${pad(month)}`);
      await load();
    },
    [db, load, year, month]
  );

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const byCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  return { transactions, loading, add, remove, stopRecurring, reload: load, totalIncome, totalExpense, byCategory };
}

export function useRecentTransactions(limit = 5) {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const load = useCallback(() => {
    getRecentTransactions(db, limit).then(setTransactions);
  }, [db, limit]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return transactions;
}

export function useAllTimeBalance() {
  const db = useSQLiteContext();
  const [totals, setTotals] = useState({ totalIncome: 0, totalExpense: 0 });

  const load = useCallback(() => {
    getAllTimeTotals(db).then(setTotals);
  }, [db]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { ...totals, balance: totals.totalIncome - totals.totalExpense };
}
