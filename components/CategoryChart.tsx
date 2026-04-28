import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/colors';
import { getCategoryById } from '@/constants/categories';
import { formatCurrency, useFinanceStore } from '@/store/useFinanceStore';

type Props = {
  byCategory: Record<string, number>;
};

export default function CategoryChart({ byCategory }: Props) {
  const { currency } = useFinanceStore();
  const entries = Object.entries(byCategory).filter(([, v]) => v > 0);

  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  const chartData = entries.map(([catId, amount]) => {
    const cat = getCategoryById(catId);
    return {
      value: amount,
      color: cat?.color ?? Colors.muted,
      label: cat?.label ?? catId,
      catId,
      amount,
    };
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Potrošnja po kategorijama</Text>
      <View style={styles.row}>
        <PieChart
          data={chartData}
          donut
          radius={72}
          innerRadius={46}
          innerCircleColor={Colors.card}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={styles.centerAmount}>{formatCurrency(total, currency)}</Text>
              <Text style={styles.centerLabel}>ukupno</Text>
            </View>
          )}
        />
        <View style={styles.legend}>
          {chartData.map((item) => (
            <View key={item.catId} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.legendText}>
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>{formatCurrency(item.amount, currency)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  center: {
    alignItems: 'center',
  },
  centerAmount: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  centerLabel: {
    fontSize: 9,
    color: Colors.subtext,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.subtext,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
});
