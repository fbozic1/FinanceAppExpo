import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useGoals } from '@/hooks/useGoals';
import { useInsights } from '@/hooks/useInsights';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinanceStore, formatCurrency } from '@/store/useFinanceStore';
import GoalCard from '@/components/GoalCard';
import EmptyState from '@/components/EmptyState';

export default function GoalsScreen() {
  const { goals, remove, contribute } = useGoals();
  const { salary, currency } = useFinanceStore();

  const now = new Date();
  const { transactions } = useTransactions(now.getFullYear(), now.getMonth() + 1);

  const firstGoal = goals[0];
  const { monthlySavings, monthsToGoal, categoryInsights } = useInsights(
    transactions,
    goals,
    salary,
    firstGoal
  );

  const insets = useSafeAreaInsets();
  const [contributeGoalId, setContributeGoalId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const openContribute = (id: number) => {
    setContributeGoalId(id);
    setContributeAmount('');
  };

  const confirmContribute = async () => {
    const val = parseFloat(contributeAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Greška', 'Unesi ispravan iznos.');
      return;
    }
    if (contributeGoalId != null) {
      await contribute(contributeGoalId, val);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setContributeGoalId(null);
  };

  const openAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/modals/add-goal');
  };

  const savingsColor = monthlySavings >= 0 ? Colors.income : Colors.expense;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Ciljevi štednje</Text>

        {/* Monthly savings banner */}
        {salary > 0 && (
          <View style={[styles.savingsBanner, { borderColor: `${savingsColor}30` }]}>
            <View style={[styles.savingsIcon, { backgroundColor: `${savingsColor}15` }]}>
              <Ionicons
                name={monthlySavings >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                size={20}
                color={savingsColor}
              />
            </View>
            <View style={styles.savingsText}>
              <Text style={styles.savingsLabel}>Trenutna uštedina</Text>
              <Text style={[styles.savingsAmount, { color: savingsColor }]}>
                {formatCurrency(monthlySavings, currency)} / mj.
              </Text>
            </View>
          </View>
        )}

        {/* Goals list */}
        {goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="Nema ciljeva"
            subtitle="Dodaj cilj i prati napredak štednje. Pritisnite + za početak."
          />
        ) : (
          goals.map((goal) => {
            const remaining = goal.target_amount - goal.current_amount;
            const months =
              monthlySavings > 0 && remaining > 0
                ? Math.ceil(remaining / monthlySavings)
                : null;
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={remove}
                onContribute={openContribute}
                monthsToReach={months}
              />
            );
          })
        )}

        {/* Insights */}
        {categoryInsights.length > 0 && firstGoal && (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
              <Text style={styles.insightsTitle}>
                Kako brže dostići "{firstGoal.title}"?
              </Text>
            </View>
            {categoryInsights.map((insight) => (
              <View key={insight.categoryId} style={styles.insightItem}>
                <View style={styles.insightDot} />
                <Text style={styles.insightText}>
                  Uštedi na{' '}
                  <Text style={styles.insightHighlight}>{insight.categoryLabel}</Text>
                  {' '}({formatCurrency(insight.monthlySpend, currency)}/mj.) i dostigni cilj{' '}
                  <Text style={{ color: Colors.income, fontWeight: '700' }}>
                    {insight.monthsSaved}{' '}
                    {insight.monthsSaved === 1 ? 'mjesec' : 'mjeseci'} ranije
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Contribute modal */}
      <Modal
        visible={contributeGoalId != null}
        transparent
        animationType="fade"
        onRequestClose={() => setContributeGoalId(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dodaj uštedinu</Text>
            <Text style={styles.modalSubtitle}>Koliko si uspio uštedjeti?</Text>
            <TextInput
              style={styles.modalInput}
              value={contributeAmount}
              onChangeText={setContributeAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.muted}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setContributeGoalId(null)}
              >
                <Text style={styles.modalBtnCancelText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={confirmContribute}
              >
                <Text style={styles.modalBtnConfirmText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 100,
    gap: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 2,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
  },
  savingsIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsText: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 13,
    color: Colors.subtext,
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  insightsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
    gap: 12,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  insightItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
    marginTop: 7,
    flexShrink: 0,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.subtext,
    lineHeight: 20,
  },
  insightHighlight: {
    color: Colors.text,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.subtext,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    textAlign: 'center',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalBtnConfirm: {
    backgroundColor: Colors.accent,
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.subtext,
  },
  modalBtnConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
