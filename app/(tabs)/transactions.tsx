import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useTransactions } from '@/hooks/useTransactions';
import { type Transaction } from '@/db/transactions';
import TransactionItem from '@/components/TransactionItem';
import EmptyState from '@/components/EmptyState';

const MONTHS = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac',
];

type TxFilter = 'all' | 'income' | 'expense';
type Section = { title: string; data: Transaction[] };

const FILTER_CHIPS: { key: TxFilter; label: string; color: string }[] = [
  { key: 'all', label: 'Sve', color: Colors.accent },
  { key: 'income', label: 'Prihodi', color: Colors.income },
  { key: 'expense', label: 'Troškovi', color: Colors.expense },
];

function formatDateLabel(isoDate: string): string {
  const today = new Date();
  const todayStr = today.toISOString().substring(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);

  if (isoDate === todayStr) return 'Danas';
  if (isoDate === yesterdayStr) return 'Jučer';

  const [yr, mo, dy] = isoDate.split('-');
  return `${dy}.${mo}.${yr}.`;
}

function groupByDate(transactions: Transaction[]): Section[] {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const day = tx.date.substring(0, 10);
    if (!groups[day]) groups[day] = [];
    groups[day].push(tx);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ title: formatDateLabel(date), data }));
}

export default function TransactionsScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const insets = useSafeAreaInsets();
  const searchRef = useRef<TextInput>(null);

  const { transactions, remove, stopRecurring } = useTransactions(year, month);

  const openPicker = () => {
    setPickerYear(year);
    setPickerOpen(true);
    Haptics.selectionAsync();
  };

  const selectMonth = (m: number) => {
    setMonth(m);
    setYear(pickerYear);
    setPickerOpen(false);
    Haptics.selectionAsync();
  };

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchQuery('');
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    Haptics.selectionAsync();
  };

  const filtered = transactions
    .filter((t) => filter === 'all' || t.type === filter)
    .filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const sections = groupByDate(filtered);

  const prevMonth = () => {
    Haptics.selectionAsync();
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    Haptics.selectionAsync();
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transakcije</Text>
        <TouchableOpacity
          style={[styles.iconBtn, searchOpen && { borderColor: Colors.accent, backgroundColor: `${Colors.accent}15` }]}
          onPress={toggleSearch}
        >
          <Ionicons name={searchOpen ? 'close-outline' : 'search-outline'} size={20} color={searchOpen ? Colors.accent : Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      {searchOpen && (
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={Colors.muted} style={{ marginLeft: 12 }} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pretraži transakcije..."
            placeholderTextColor={Colors.muted}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 12 }}>
              <Ionicons name="close-circle" size={16} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openPicker} style={styles.monthPickerBtn}>
          <Text style={styles.monthText}>{MONTHS[month - 1]} {year}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.subtext} />
        </TouchableOpacity>
        <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Month/Year picker modal */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.pickerContainer} onPress={() => {}}>
            {/* Year row */}
            <View style={styles.pickerYearRow}>
              <TouchableOpacity
                onPress={() => { setPickerYear((y) => y - 1); Haptics.selectionAsync(); }}
                style={styles.arrowBtn}
              >
                <Ionicons name="chevron-back" size={18} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.pickerYearText}>{pickerYear}</Text>
              <TouchableOpacity
                onPress={() => { setPickerYear((y) => y + 1); Haptics.selectionAsync(); }}
                style={styles.arrowBtn}
              >
                <Ionicons name="chevron-forward" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Month grid */}
            <View style={styles.monthGrid}>
              {MONTHS.map((name, i) => {
                const m = i + 1;
                const isSelected = m === month && pickerYear === year;
                const isCurrentReal = m === now.getMonth() + 1 && pickerYear === now.getFullYear();
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.monthCell,
                      isSelected && styles.monthCellSelected,
                      isCurrentReal && !isSelected && styles.monthCellCurrent,
                    ]}
                    onPress={() => selectMonth(m)}
                  >
                    <Text style={[
                      styles.monthCellText,
                      isSelected && styles.monthCellTextSelected,
                      isCurrentReal && !isSelected && { color: Colors.accent },
                    ]}>
                      {name.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter chips */}
      <View style={styles.chips}>
        {FILTER_CHIPS.map(({ key, label, color }) => {
          const isActive = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, isActive && { backgroundColor: `${color}20`, borderColor: color }]}
              onPress={() => setFilter(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {sections.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Nema transakcija"
          subtitle="Dodaj prvu transakciju pritiskom na + gumb"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderSectionHeader={({ section }) => (
            <Text style={styles.dateHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => (
            <View style={styles.itemCard}>
              <TransactionItem transaction={item} onDelete={remove} onStopRecurring={stopRecurring} />
              {index < section.data.length - 1 && <View style={styles.separator} />}
            </View>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 15,
    color: Colors.text,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  monthPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthText: { fontSize: 14, fontWeight: '600', color: Colors.subtext },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 20,
    width: 300,
    gap: 16,
  },
  pickerYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    flexGrow: 1,
  },
  monthCellSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  monthCellCurrent: {
    borderColor: Colors.accent,
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.subtext,
  },
  monthCellTextSelected: {
    color: '#fff',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 4,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.subtext,
    marginTop: 14,
    marginBottom: 6,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
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
