import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Factory, Settings, DollarSign, Users } from 'lucide-react-native';
import WebFallback from '@/components/WebFallback';

export default function HomeScreen() {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    if (Platform.OS === 'web') {
      alert('Bu özellik sadece mobil cihazlarda (Android/iOS) çalışır.\n\nExpo Go uygulaması ile QR kod tarayarak test edebilirsiniz.');
      return;
    }
    router.push(route as any);
  };

  const menuItems = [
    {
      id: 'stocks',
      title: 'Stok Takip',
      icon: Package,
      color: '#3b82f6',
      route: '/screens/stocks',
    },
    {
      id: 'production-line',
      title: 'Üretim Bandı',
      icon: Factory,
      color: '#8b5cf6',
      route: '/screens/production-line',
    },
    {
      id: 'production',
      title: 'Üretim Süreçleri',
      icon: Settings,
      color: '#f59e0b',
      route: '/screens/production',
    },
    {
      id: 'sales',
      title: 'Satış Kârlılık',
      icon: DollarSign,
      color: '#10b981',
      route: '/screens/sales',
    },
    {
      id: 'customers',
      title: 'Müşteri Bilgileri',
      icon: Users,
      color: '#ec4899',
      route: '/screens/customers',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 ERP STOK</Text>
        <Text style={styles.headerSubtitle}>Stok Yönetim Sistemi</Text>
      </View>

      <View style={styles.content}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuCard, { borderLeftColor: item.color }]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Icon size={32} color={item.color} strokeWidth={2.5} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <View style={styles.arrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#93c5fd',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748b',
  },
});
