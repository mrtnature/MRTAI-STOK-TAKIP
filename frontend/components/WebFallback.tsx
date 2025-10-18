import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';

export default function WebFallback() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>📱 ERP STOK</Text>
        <Text style={styles.subtitle}>Mobil Uygulama</Text>
        <Text style={styles.description}>
          Bu uygulama sadece Android ve iOS cihazlarda çalışır.
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Nasıl kullanılır?</Text>
          <Text style={styles.infoText}>
            1. Expo Go uygulamasını indirin{'\n'}
            2. QR kodu tarayın{'\n'}
            3. Uygulamayı cihazınızda açın
          </Text>
        </View>
        <View style={styles.features}>
          <Text style={styles.featureTitle}>Özellikler:</Text>
          <Text style={styles.feature}>✓ Offline Stok Yönetimi</Text>
          <Text style={styles.feature}>✓ Üretim Şablonları</Text>
          <Text style={styles.feature}>✓ Satış Takibi</Text>
          <Text style={styles.feature}>✓ Kritik Stok Uyarıları</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  content: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#93c5fd',
    marginBottom: 32,
  },
  description: {
    fontSize: 18,
    color: '#dbeafe',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
  },
  infoBox: {
    backgroundColor: '#1e40af',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#dbeafe',
    lineHeight: 24,
  },
  features: {
    backgroundColor: '#2563eb',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  feature: {
    fontSize: 16,
    color: '#dbeafe',
    marginBottom: 8,
  },
});
