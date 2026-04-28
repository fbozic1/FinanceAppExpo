import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { type Goal } from '@/db/goals';
import { formatCurrency, useFinanceStore } from '@/store/useFinanceStore';

type Props = {
  goal: Goal;
  onDelete: (id: number) => void;
  onContribute: (id: number) => void;
  monthsToReach?: number | null;
};

export default function GoalCard({ goal, onDelete, onContribute, monthsToReach }: Props) {
  const { currency } = useFinanceStore();
  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const percent = Math.round(Math.min(1, progress) * 100);
  const isComplete = progress >= 1;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Izbriši cilj', `Jesi li siguran da želiš izbrisati "${goal.title}"?`, [
      { text: 'Odustani', style: 'cancel' },
      { text: 'Izbriši', style: 'destructive', onPress: () => onDelete(goal.id) },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.card, isComplete && styles.cardComplete]}
      onLongPress={handleLongPress}
      onPress={() => onContribute(goal.id)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconBg,
            { backgroundColor: isComplete ? `${Colors.income}20` : `${Colors.accent}20` },
          ]}
        >
          <Ionicons
            name={(goal.icon ?? 'star-outline') as any}
            size={22}
            color={isComplete ? Colors.income : Colors.accent}
          />
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.title}>{goal.title}</Text>
          {isComplete ? (
            <Text style={[styles.eta, { color: Colors.income }]}>Cilj dostignut! 🎉</Text>
          ) : monthsToReach != null ? (
            <Text style={styles.eta}>~{monthsToReach} mj. uz trenutnu štednju</Text>
          ) : null}
        </View>

        <Text style={[styles.percent, { color: isComplete ? Colors.income : Colors.accent }]}>
          {percent}%
        </Text>
      </View>

      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percent}%`,
              backgroundColor: isComplete ? Colors.income : Colors.accent,
            },
          ]}
        />
      </View>

      <View style={styles.amounts}>
        <Text style={styles.currentAmount}>{formatCurrency(goal.current_amount, currency)}</Text>
        <Text style={styles.targetAmount}>od {formatCurrency(goal.target_amount, currency)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardComplete: {
    borderColor: `${Colors.income}50`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  eta: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 2,
  },
  percent: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  targetAmount: {
    fontSize: 13,
    color: Colors.subtext,
  },
});
