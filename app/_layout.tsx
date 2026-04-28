import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDb } from '@/db/database';
import { Colors } from '@/constants/colors';
import { useFinanceStore } from '@/store/useFinanceStore';

function SettingsLoader() {
  const loadSettings = useFinanceStore((s) => s.loadSettings);
  useEffect(() => {
    loadSettings();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="finance.db" onInit={migrateDb}>
      <SettingsLoader />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          contentStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modals/add-transaction"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modals/add-goal"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
      <StatusBar style="light" />
    </SQLiteProvider>
  );
}
