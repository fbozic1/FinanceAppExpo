import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  type Transaction,
  type NewTransaction,
  getTransactionsByMonth,
  getRecentTransactions,
  insertTransaction,
  deleteTransaction,
  syncRecurringTransactions,
} from '@/db/transactions';

export function useTransactions(year: number, month: number) {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await syncRecurringTransactions(db, year, month);
    const data = await getTransactionsByMonth(db, year, month);
    setTransactions(data);
    setLoading(false);
  }, [db, year, month]);

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

  return { transactions, loading, add, remove, reload: load, totalIncome, totalExpense, byCategory };
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
