import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/store/useFinanceStore';

type Props = {
  salary: number;
  totalIncome: number;
  totalExpense: number;
  currency: string;
};

export default function BalanceCard({ salary, totalIncome, totalExpense, currency }: Props) {
  const available = salary - totalExpense;
  const isPositive = available >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Dostupno ovaj mjesec</Text>
      <Text style={[styles.balance, { color: isPositive ? Colors.income : Colors.expense }]}>
        {formatCurrency(available, currency)}
      </Text>

      <View style={styles.row}>
        <View style={styles.statItem}>
          <View style={[styles.iconBg, { backgroundColor: `${Colors.income}20` }]}>
            <Ionicons name="arrow-down-outline" size={16} color={Colors.income} />
          </View>
          <View>
            <Text style={styles.statLabel}>Prihodi</Text>
            <Text style={[styles.statValue, { color: Colors.income }]}>
              {formatCurrency(totalIncome, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={[styles.iconBg, { backgroundColor: `${Colors.expense}20` }]}>
            <Ionicons name="arrow-up-outline" size={16} color={Colors.expense} />
          </View>
          <View>
            <Text style={styles.statLabel}>Rashodi</Text>
            <Text style={[styles.statValue, { color: Colors.expense }]}>
              {formatCurrency(totalExpense, currency)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  label: {
    fontSize: 13,
    color: Colors.subtext,
    marginBottom: 6,
  },
  balance: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.subtext,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 12,
  },
});
