import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { getCategoryById } from '@/constants/categories';
import { type Transaction } from '@/db/transactions';
import { formatCurrency, useFinanceStore } from '@/store/useFinanceStore';

type Props = {
  transaction: Transaction;
  onDelete?: (id: number) => void;
  onStopRecurring?: (title: string, category: string, type: string) => void;
};

export default function TransactionItem({ transaction, onDelete, onStopRecurring }: Props) {
  const { currency } = useFinanceStore();
  const cat = getCategoryById(transaction.category);
  const isIncome = transaction.type === 'income';
  const isRecurring = transaction.is_recurring === 1;

  const handleLongPress = () => {
    if (!onDelete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isRecurring && onStopRecurring) {
      Alert.alert(
        transaction.title,
        'Što želiš napraviti s ovom transakcijom?',
        [
          { text: 'Odustani', style: 'cancel' },
          {
            text: 'Zaustavi ponavljanje',
            onPress: () =>
              Alert.alert(
                'Zaustavi ponavljanje',
                `Zaustavi automatsko ponavljanje za "${transaction.title}"? Postojeći unosi ostaju.`,
                [
                  { text: 'Odustani', style: 'cancel' },
                  {
                    text: 'Zaustavi',
                    style: 'destructive',
                    onPress: () => onStopRecurring(transaction.title, transaction.category, transaction.type),
                  },
                ]
              ),
          },
          {
            text: 'Izbriši ovaj unos',
            style: 'destructive',
            onPress: () => onDelete(transaction.id),
          },
        ]
      );
    } else {
      Alert.alert(
        'Izbriši transakciju',
        `Jesi li siguran da želiš izbrisati "${transaction.title}"?`,
        [
          { text: 'Odustani', style: 'cancel' },
          { text: 'Izbriši', style: 'destructive', onPress: () => onDelete(transaction.id) },
        ]
      );
    }
  };

  const date = new Date(transaction.date);
  const timeStr = date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      onLongPress={onDelete ? handleLongPress : undefined}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBg, { backgroundColor: `${cat?.color ?? Colors.muted}20` }]}>
        <Ionicons
          name={(cat?.icon ?? 'ellipsis-horizontal-outline') as any}
          size={20}
          color={cat?.color ?? Colors.muted}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{transaction.title}</Text>
          {isRecurring && (
            <Ionicons name="repeat-outline" size={13} color={Colors.accent} />
          )}
        </View>
        <Text style={styles.category}>{cat?.label ?? transaction.category}</Text>
        {transaction.note ? (
          <Text style={styles.note} numberOfLines={1}>{transaction.note}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: isIncome ? Colors.income : Colors.expense }]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
        </Text>
        <Text style={styles.time}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    flexShrink: 1,
  },
  category: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 2,
  },
  note: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: Colors.subtext,
  },
});
