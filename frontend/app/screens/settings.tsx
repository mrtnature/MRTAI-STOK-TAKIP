import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Switch,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Bell, Info } from 'lucide-react-native';
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
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_name: '',
    from_email: '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      loadSettings();
    }
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#1e40af" />
            <Text style={styles.sectionTitle}>Bildirimler</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Kritik Stok Uyarıları</Text>
              <Text style={styles.settingDescription}>
                Stok seviyesi kritik değere düştüğünde bildirim al
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#cbd5e1', true: '#60a5fa' }}
              thumbColor={notificationsEnabled ? '#1e40af' : '#f1f5f9'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color="#1e40af" />
            <Text style={styles.sectionTitle}>E-posta Ayarları</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Sipariş bildirimleri için SMTP ayarlarınızı yapılandırın.
          </Text>

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
            placeholder="MRT AI"
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
        </View>

        <View style={styles.infoBox}>
          <Info size={20} color="#1e40af" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Bilgi</Text>
            <Text style={styles.infoText}>
              SMTP ayarları yapıldıktan sonra, siparişler "Kargoya Verildi" veya "Tamamlandı"
              durumuna geçtiğinde müşterilere otomatik e-posta gönderilir.
            </Text>
            <Text style={styles.infoText}>
              Şu anda e-postalar cihazın mail uygulaması üzerinden gönderilmektedir.
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
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
    backgroundColor: '#f8fafc',
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
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoContent: {
    flex: 1,
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
