import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Native platformlarda SQLite ve bildirimler kurulumu
      const setupNative = async () => {
        const Notifications = require('expo-notifications');
        const { initDatabase } = require('@/db/database');
        
        // Bildirim yapılandırması
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
        
        // Veritabanını başlat
        await initDatabase();
        
        // Bildirim izinlerini iste
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
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
