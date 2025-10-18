import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { getDatabase } from '@/db/database';

type Settings = {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_name: '',
    from_email: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const db = getDatabase();
      const result = await db.getFirstAsync<Settings>('SELECT * FROM settings LIMIT 1');
      if (result) {
        setSettings(result);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const db = getDatabase();
      await db.runAsync(
        'UPDATE settings SET smtp_host=?, smtp_port=?, smtp_user=?, smtp_pass=?, from_name=?, from_email=? WHERE id=?',
        [
          settings.smtp_host,
          settings.smtp_port,
          settings.smtp_user,
          settings.smtp_pass,
          settings.from_name,
          settings.from_email,
          settings.id,
        ]
      );
      Alert.alert('Başarılı', 'Ayarlar kaydedildi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Ayarlar kaydedilemedi!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Management</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SMTP Ayarları</Text>
            <Text style={styles.cardSubtitle}>
              E-posta bildirimlerini otomatik göndermek için SMTP ayarlarınızı yapılandırın.
            </Text>
          </View>

          <Text style={styles.label}>SMTP Sunucusu</Text>
          <TextInput
            style={styles.input}
            placeholder="örn: smtp.gmail.com"
            value={settings.smtp_host}
            onChangeText={(text) => setSettings({ ...settings, smtp_host: text })}
          />

          <Text style={styles.label}>SMTP Port</Text>
          <TextInput
            style={styles.input}
            placeholder="587"
            value={settings.smtp_port.toString()}
            onChangeText={(text) =>
              setSettings({ ...settings, smtp_port: parseInt(text) || 587 })
            }
            keyboardType="numeric"
          />

          <Text style={styles.label}>SMTP Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={settings.smtp_user}
            onChangeText={(text) => setSettings({ ...settings, smtp_user: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>SMTP Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="Şifreniz"
            value={settings.smtp_pass}
            onChangeText={(text) => setSettings({ ...settings, smtp_pass: text })}
            secureTextEntry
          />

          <Text style={styles.label}>Gönderici Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="ERP-STOK"
            value={settings.from_name}
            onChangeText={(text) => setSettings({ ...settings, from_name: text })}
          />

          <Text style={styles.label}>Gönderici E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="noreply@example.com"
            value={settings.from_email}
            onChangeText={(text) => setSettings({ ...settings, from_email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>Ayarları Kaydet</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Bilgi</Text>
            <Text style={styles.infoText}>
              SMTP ayarları yaptıktan sonra, siparişler "Kargoya Verildi" veya "Tamamlandı"
              durumuna geçtiğinde müşterilere otomatik e-posta gönderilir.
            </Text>
            <Text style={styles.infoText}>
              Şu anda e-postalar cihazın mail uygulaması üzerinden gönderilmektedir. SMTP
              entegrasyonu gelecek sürümde eklenecektir.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#1e40af',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 8,
  },
});
