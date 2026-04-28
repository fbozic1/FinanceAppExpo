import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '@/constants/colors';
import { insertGoal } from '@/db/goals';

const GOAL_ICONS = [
  'laptop-outline',
  'car-outline',
  'home-outline',
  'airplane-outline',
  'phone-portrait-outline',
  'camera-outline',
  'bicycle-outline',
  'gift-outline',
  'school-outline',
  'diamond-outline',
  'musical-notes-outline',
  'game-controller-outline',
  'star-outline',
  'heart-outline',
  'trophy-outline',
  'rocket-outline',
] as const;

export default function AddGoalModal() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('star-outline');

  const handleSave = async () => {
    const target = parseFloat(targetAmount.replace(',', '.'));
    if (!title.trim()) {
      Alert.alert('Greška', 'Unesi naziv cilja.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      Alert.alert('Greška', 'Unesi ispravan ciljani iznos.');
      return;
    }

    await insertGoal(db, {
      title: title.trim(),
      target_amount: target,
      current_amount: 0,
      icon: selectedIcon,
      deadline: null,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 16, 40) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Naziv cilja</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="npr. MacBook Pro, Godišnji odmor, Auto..."
            placeholderTextColor={Colors.muted}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Target amount */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ciljani iznos (€)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.muted}
          />
        </View>

        {/* Icon picker */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ikona</Text>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map((icon) => {
              const isSelected = selectedIcon === icon;
              return (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconBtn, isSelected && styles.iconBtnActive]}
                  onPress={() => {
                    setSelectedIcon(icon);
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={isSelected ? Colors.accent : Colors.subtext}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Stvori cilj</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  field: {
    gap: 10,
  },
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
  amountInput: {
    fontSize: 22,
    fontWeight: '700',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: `${Colors.accent}15`,
    borderColor: Colors.accent,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
