import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const setupNative = async () => {
        const Notifications = require('expo-notifications');
        const { initDatabase } = require('@/db/database');
        
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
        
        await initDatabase();
        
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Bildirim izni verilmedi');
        }
      };
      
      setupNative();
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="screens/stocks" />
      <Stack.Screen name="screens/production-line" />
      <Stack.Screen name="screens/production" />
      <Stack.Screen name="screens/sales" />
      <Stack.Screen name="screens/customers" />
    </Stack>
  );
}
