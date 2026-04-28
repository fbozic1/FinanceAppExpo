import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '@/constants/colors';
import { getCategoryById, EXPENSE_CATEGORIES } from '@/constants/categories';
import { formatCurrency, useFinanceStore } from '@/store/useFinanceStore';
import { useTransactions } from '@/hooks/useTransactions';
import CategoryChart from '@/components/CategoryChart';
import EmptyState from '@/components/EmptyState';
import {
  getTransactionsByYear,
  getAllTransactions,
  getTransactionsByWeek,
  type Transaction,
} from '@/db/transactions';
import { useEffect } from 'react';

type Period = 'week' | 'month' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Tjedan',
  month: 'Mjesec',
  year: 'Godina',
  all: 'Sve',
};

function usePeriodTransactions(period: Period) {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const { transactions: monthTx } = useTransactions(now.getFullYear(), now.getMonth() + 1);

  const load = useCallback(async () => {
    setLoading(true);
    let data: Transaction[] = [];
    if (period === 'month') {
      data = monthTx;
      setTransactions(data);
      setLoading(false);
      return;
    }
    if (period === 'week') data = await getTransactionsByWeek(db);
    else if (period === 'year') data = await getTransactionsByYear(db, now.getFullYear());
    else data = await getAllTransactions(db);
    setTransactions(data);
    setLoading(false);
  }, [db, period, monthTx]);

  useEffect(() => { load(); }, [load]);

  const expenses = transactions.filter((t) => t.type === 'expense');
  const incomes = transactions.filter((t) => t.type === 'income');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {});

  return { transactions, loading, totalExpense, totalIncome, byCategory };
}

export default function StatisticsScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const { currency } = useFinanceStore();
  const { totalExpense, totalIncome, byCategory } = usePeriodTransactions(period);
  const insets = useSafeAreaInsets();

  const categoryBreakdown = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([catId, amount]) => {
      const cat = getCategoryById(catId);
      return {
        catId,
        label: cat?.label ?? catId,
        color: cat?.color ?? Colors.muted,
        amount,
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    });

  const hasData = Object.keys(byCategory).length > 0;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Statistika</Text>

        {/* Period filter */}
        <View style={styles.filterRow}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterChip, period === p && styles.filterChipActive]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, period === p && styles.filterChipTextActive]}>
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary pills */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: `${Colors.income}30` }]}>
            <Text style={styles.summaryLabel}>Prihodi</Text>
            <Text style={[styles.summaryAmount, { color: Colors.income }]}>
              {formatCurrency(totalIncome, currency)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: `${Colors.expense}30` }]}>
            <Text style={styles.summaryLabel}>Troškovi</Text>
            <Text style={[styles.summaryAmount, { color: Colors.expense }]}>
              {formatCurrency(totalExpense, currency)}
            </Text>
          </View>
        </View>

        {/* Chart */}
        {hasData ? (
          <>
            <Text style={styles.sectionTitle}>Troškovi po kategorijama</Text>
            <CategoryChart byCategory={byCategory} />

            {/* Legend */}
            <View style={styles.legend}>
              {categoryBreakdown.map((item) => (
                <View key={item.catId} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendAmount}>{formatCurrency(item.amount, currency)}</Text>
                  <Text style={[styles.legendPercent, { color: item.color }]}>
                    {item.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="Nema podataka"
            subtitle="Dodaj transakcije da vidiš statistiku"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  filterChipTextActive: {
    color: Colors.accent,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.subtext,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
  },
  legend: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 14,
    color: Colors.subtext,
    fontWeight: '500',
  },
  legendPercent: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 38,
    textAlign: 'right',
  },
});
