import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useFinanceStore, formatCurrency } from '@/store/useFinanceStore';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'HRK', 'CHF'];

function SettingRow({
  icon,
  label,
  value,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: `${color ?? Colors.accent}18` }]}>
        <Ionicons name={icon as any} size={18} color={color ?? Colors.accent} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { name, setName, salary, setSalary, currency, setCurrency } = useFinanceStore();
  const insets = useSafeAreaInsets();

  const [showNameModal, setShowNameModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [salaryInput, setSalaryInput] = useState(salary > 0 ? String(salary) : '');

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const saveName = () => {
    if (!nameInput.trim()) {
      Alert.alert('Greška', 'Unesi ime.');
      return;
    }
    setName(nameInput.trim());
    setShowNameModal(false);
  };

  const saveSalary = () => {
    const val = parseFloat(salaryInput.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      Alert.alert('Greška', 'Unesi ispravan iznos.');
      return;
    }
    setSalary(val);
    setShowSalaryModal(false);
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Profil</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.avatarName}>{name || 'Postavi ime →'}</Text>
          <Text style={styles.avatarSub}>
            {salary > 0 ? `Plaća: ${formatCurrency(salary, currency)}/mj.` : 'Plaća nije postavljena'}
          </Text>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Osobni podaci</Text>
          <View style={styles.card}>
            <SettingRow
              icon="person-outline"
              label="Ime"
              value={name || 'Nije postavljeno'}
              onPress={() => { setNameInput(name); setShowNameModal(true); }}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="wallet-outline"
              label="Neto plaća"
              value={salary > 0 ? formatCurrency(salary, currency) : 'Nije postavljeno'}
              onPress={() => { setSalaryInput(salary > 0 ? String(salary) : ''); setShowSalaryModal(true); }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Postavke</Text>
          <View style={styles.card}>
            <SettingRow
              icon="cash-outline"
              label="Valuta"
              value={currency}
              onPress={() => setShowCurrencyModal(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="flag-outline"
              label="Ciljevi štednje"
              onPress={() => router.push('/(tabs)/goals')}
              color={Colors.warning}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>O aplikaciji</Text>
          <View style={styles.card}>
            <SettingRow
              icon="information-circle-outline"
              label="FinanceApp"
              value="v1.0.0"
              color={Colors.subtext}
            />
          </View>
        </View>
      </ScrollView>

      {/* Name modal */}
      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Unesi ime</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="npr. Ivan"
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowNameModal(false)}>
                <Text style={styles.btnCancelText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={saveName}>
                <Text style={styles.btnConfirmText}>Spremi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Salary modal */}
      <Modal visible={showSalaryModal} transparent animationType="fade" onRequestClose={() => setShowSalaryModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Neto plaća ({currency})</Text>
            <TextInput
              style={[styles.modalInput, { fontSize: 24, fontWeight: '700', textAlign: 'center' }]}
              value={salaryInput}
              onChangeText={setSalaryInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveSalary}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowSalaryModal(false)}>
                <Text style={styles.btnCancelText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={saveSalary}>
                <Text style={styles.btnConfirmText}>Spremi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency modal */}
      <Modal visible={showCurrencyModal} transparent animationType="fade" onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Odaberi valutu</Text>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyRow, c === currency && styles.currencyRowActive]}
                onPress={() => { setCurrency(c); setShowCurrencyModal(false); }}
              >
                <Text style={[styles.currencyText, c === currency && { color: Colors.accent }]}>
                  {c}
                </Text>
                {c === currency && (
                  <Ionicons name="checkmark" size={18} color={Colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40, gap: 20 },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.accent}25`,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.accent,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  avatarSub: {
    fontSize: 13,
    color: Colors.subtext,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.subtext,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginLeft: 64,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '600', color: Colors.subtext },
  btnConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  btnConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  currencyRowActive: {},
  currencyText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});
