import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useFinanceStore, formatCurrency } from '@/store/useFinanceStore';
import { useTransactions, useRecentTransactions } from '@/hooks/useTransactions';
import CategoryChart from '@/components/CategoryChart';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';

export default function DashboardScreen() {
  const { salary, currency, name } = useFinanceStore();
  const [hideBalance, setHideBalance] = useState(false);
  const insets = useSafeAreaInsets();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { totalIncome, totalExpense, byCategory } = useTransactions(year, month);
  const recentTransactions = useRecentTransactions(5);

  const balance = totalIncome - totalExpense;
  const budgetPercent = salary > 0 ? Math.min(Math.round((totalExpense / salary) * 100), 100) : 0;
  const hasChart = Object.keys(byCategory).length > 0;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Pozdrav, {name || 'korisnik'} 👋</Text>
            <Text style={styles.period}>Ovaj mjesec</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>UKUPNO STANJE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {hideBalance ? '€ ••••••' : formatCurrency(balance, currency)}
            </Text>
            <TouchableOpacity
              onPress={() => setHideBalance((v) => !v)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.subtext}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statsCard}>
          {/* Prihodi */}
          <View style={styles.statRow}>
            <View style={[styles.statIconBg, { backgroundColor: `${Colors.income}20` }]}>
              <Ionicons name="trending-up-outline" size={18} color={Colors.income} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Prihodi</Text>
              <Text style={styles.statSub}>ovaj mjesec</Text>
            </View>
            <Text style={[styles.statAmount, { color: Colors.income }]}>
              {formatCurrency(totalIncome, currency)}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Troškovi */}
          <View style={styles.statRow}>
            <View style={[styles.statIconBg, { backgroundColor: `${Colors.expense}20` }]}>
              <Ionicons name="trending-down-outline" size={18} color={Colors.expense} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Troškovi</Text>
              <Text style={styles.statSub}>ovaj mjesec</Text>
            </View>
            <Text style={[styles.statAmount, { color: Colors.expense }]}>
              {formatCurrency(totalExpense, currency)}
            </Text>
          </View>

          {salary > 0 && (
            <>
              <View style={styles.divider} />
              {/* Budžet */}
              <View style={styles.statRow}>
                <View style={[styles.statIconBg, { backgroundColor: `${Colors.warning}20` }]}>
                  <Ionicons name="wallet-outline" size={18} color={Colors.warning} />
                </View>
                <View style={[styles.statInfo, { flex: 1 }]}>
                  <Text style={styles.statLabel}>Budžet</Text>
                  <Text style={styles.statSub} numberOfLines={1}>
                    {formatCurrency(totalExpense, currency)} od {formatCurrency(salary, currency)}
                  </Text>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${budgetPercent}%`,
                          backgroundColor: budgetPercent > 80 ? Colors.expense : Colors.warning,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.statAmount, { color: Colors.warning }]}>
                  {budgetPercent}%
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Chart */}
        {hasChart && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troškovi po kategorijama</Text>
            <CategoryChart byCategory={byCategory} />
          </View>
        )}

        {/* Recent transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zadnje transakcije</Text>
          <View style={styles.txCard}>
            {recentTransactions.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="Nema transakcija"
                subtitle="Dodaj prvu transakciju pritiskom na + gumb"
              />
            ) : (
              recentTransactions.map((t, i) => (
                <React.Fragment key={t.id}>
                  <TransactionItem transaction={t} />
                  {i < recentTransactions.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32, gap: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.text },
  period: { fontSize: 13, color: Colors.subtext, marginTop: 2 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    paddingHorizontal: 16,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: Colors.text,
  },
  statsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  statSub: {
    fontSize: 12,
    color: Colors.subtext,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginLeft: 66,
  },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
  },
  txCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 16,
  },
});
