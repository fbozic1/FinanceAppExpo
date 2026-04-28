import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function AddTab() {
  useEffect(() => {
    router.replace('/modals/add-transaction');
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#121212' }} />;
}
