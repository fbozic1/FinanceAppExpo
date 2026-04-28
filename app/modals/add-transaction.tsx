import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '@/constants/colors';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { insertTransaction, type RecurringInterval } from '@/db/transactions';
import { useFinanceStore } from '@/store/useFinanceStore';

type TxType = 'expense' | 'income';

const SCREEN_W = Dimensions.get('window').width;
const CELL_W = Math.floor((SCREEN_W - 32 - 16) / 3);

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}.`;
}

function currencySymbol(currency: string): string {
  if (currency === 'EUR') return '€';
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  return currency;
}

export default function AddTransactionModal() {
  const db = useSQLiteContext();
  const { lastCategory, setLastCategory, currency } = useFinanceStore();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(() =>
    EXPENSE_CATEGORIES.some((c) => c.id === lastCategory) ? lastCategory : ''
  );
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('monthly');

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const typeColor = type === 'expense' ? Colors.expense : Colors.income;

  const handleTypeChange = (t: TxType) => {
    setType(t);
    const cats = t === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!cats.some((c) => c.id === category)) setCategory('');
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Greška', 'Unesi ispravan iznos.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Greška', 'Unesi naziv transakcije.');
      return;
    }
    if (!category) {
      Alert.alert('Greška', 'Odaberi kategoriju.');
      return;
    }

    await insertTransaction(db, {
      title: title.trim(),
      amount: amt,
      type,
      category,
      date: selectedDate.toISOString(),
      note: note.trim() || null,
      is_recurring: isRecurring ? 1 : 0,
      recurring_interval: recurringInterval,
    });

    setLastCategory(category);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova transakcija</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 16, 40) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Iznos</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>{currencySymbol(currency)}</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.muted}
                autoFocus
              />
            </View>
          </View>

          {/* Type toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'income' && { backgroundColor: `${Colors.income}20`, borderColor: Colors.income },
              ]}
              onPress={() => handleTypeChange('income')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up-outline"
                size={16}
                color={type === 'income' ? Colors.income : Colors.subtext}
              />
              <Text style={[styles.typeBtnText, type === 'income' && { color: Colors.income }]}>
                Prihod
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'expense' && { backgroundColor: `${Colors.expense}20`, borderColor: Colors.expense },
              ]}
              onPress={() => handleTypeChange('expense')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down-outline"
                size={16}
                color={type === 'expense' ? Colors.expense : Colors.subtext}
              />
              <Text style={[styles.typeBtnText, type === 'expense' && { color: Colors.expense }]}>
                Trošak
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Naziv</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="npr. Kaufland, Najam, Plaća..."
              placeholderTextColor={Colors.muted}
              returnKeyType="next"
            />
          </View>

          {/* Categories grid */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Kategorija</Text>
            <View style={styles.catGrid}>
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catCell,
                      isSelected && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
                    ]}
                    onPress={() => { setCategory(cat.id); Haptics.selectionAsync(); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.catIconBg, { backgroundColor: isSelected ? `${cat.color}25` : Colors.background }]}>
                      <Ionicons
                        name={cat.icon as any}
                        size={22}
                        color={isSelected ? cat.color : Colors.subtext}
                      />
                    </View>
                    <Text style={[styles.catLabel, isSelected && { color: cat.color }]} numberOfLines={1}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date */}
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => { setShowDatePicker(true); Haptics.selectionAsync(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.dateIconBg, { backgroundColor: `${Colors.accent}20` }]}>
              <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.dateLabel}>Datum</Text>
            <Text style={[styles.dateValue, { color: Colors.accent }]}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </TouchableOpacity>

          {/* Android: inline picker; iOS: modal */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(e: DateTimePickerEvent, date?: Date) => {
                setShowDatePicker(false);
                if (e.type === 'set' && date) setSelectedDate(date);
              }}
            />
          )}

          {/* Recurring toggle */}
          <TouchableOpacity
            style={styles.recurringRow}
            onPress={() => { setIsRecurring((v) => !v); Haptics.selectionAsync(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.dateIconBg, { backgroundColor: `${Colors.accent}20` }]}>
              <Ionicons name="repeat-outline" size={18} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recurringLabel}>Ponavljajuća naplata</Text>
              <Text style={styles.recurringSubtext}>Automatski dodaje se svaki period</Text>
            </View>
            <View style={[styles.toggle, isRecurring && { backgroundColor: Colors.accent }]}>
              <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {/* Interval selector (only when recurring) */}
          {isRecurring && (
            <View style={styles.intervalRow}>
              {(['monthly', 'yearly'] as RecurringInterval[]).map((interval) => {
                const label = interval === 'monthly' ? 'Mjesečno' : 'Godišnje';
                const isActive = recurringInterval === interval;
                return (
                  <TouchableOpacity
                    key={interval}
                    style={[styles.intervalChip, isActive && { backgroundColor: `${Colors.accent}20`, borderColor: Colors.accent }]}
                    onPress={() => { setRecurringInterval(interval); Haptics.selectionAsync(); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.intervalChipText, isActive && { color: Colors.accent }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Note */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Opis (opcionalno)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Dodaj bilješku..."
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: typeColor }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Spremi transakciju</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.iosPickerOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosPickerCancel}>Odustani</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosPickerDone}>Gotovo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_: DateTimePickerEvent, date?: Date) => {
                  if (date) setSelectedDate(date);
                }}
                style={{ backgroundColor: Colors.card }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.card, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  amountSection: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.subtext,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.subtext,
    marginTop: 8,
  },
  amountInput: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.subtext,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  noteInput: { height: 80 },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCell: {
    width: CELL_W,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  catIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.subtext,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  dateIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  dateValue: { fontSize: 14, color: Colors.subtext },
  saveBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  iosPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  iosPickerCancel: { fontSize: 16, color: Colors.subtext },
  iosPickerDone: { fontSize: 16, fontWeight: '700', color: Colors.accent },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  recurringLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  recurringSubtext: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.cardBorder,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.muted,
  },
  toggleThumbOn: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  intervalChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
});
