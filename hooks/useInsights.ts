import { useMemo } from 'react';
import { type Transaction } from '@/db/transactions';
import { type Goal } from '@/db/goals';
import { getCategoryById } from '@/constants/categories';

export type CategoryInsight = {
  categoryId: string;
  categoryLabel: string;
  monthlySpend: number;
  monthsSaved: number;
};

export function useInsights(
  transactions: Transaction[],
  goals: Goal[],
  salary: number,
  targetGoal?: Goal
) {
  return useMemo(() => {
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = salary - totalExpense;

    const remaining =
      targetGoal != null ? targetGoal.target_amount - targetGoal.current_amount : null;

    const monthsToGoal =
      remaining != null && monthlySavings > 0
        ? Math.ceil(remaining / monthlySavings)
        : null;

    const byCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});

    const categoryInsights: CategoryInsight[] = Object.entries(byCategory)
      .map(([categoryId, monthlySpend]) => {
        const cat = getCategoryById(categoryId);
        const newSavings = monthlySavings + monthlySpend;
        const newMonths =
          remaining != null && newSavings > 0 ? Math.ceil(remaining / newSavings) : null;
        const monthsSaved =
          monthsToGoal != null && newMonths != null ? monthsToGoal - newMonths : 0;
        return {
          categoryId,
          categoryLabel: cat?.label ?? categoryId,
          monthlySpend,
          monthsSaved,
        };
      })
      .filter((i) => i.monthsSaved > 0)
      .sort((a, b) => b.monthsSaved - a.monthsSaved)
      .slice(0, 3);

    return { monthlySavings, monthsToGoal, categoryInsights };
  }, [transactions, goals, salary, targetGoal]);
}
