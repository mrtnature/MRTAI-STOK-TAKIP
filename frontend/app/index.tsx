import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Factory, Settings, DollarSign, Users, Bell, Cog } from 'lucide-react-native';
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
      gradient: ['#60a5fa', '#3b82f6'],
      route: '/screens/stocks',
    },
    {
      id: 'production-line',
      title: 'Üretim Bandı',
      icon: Factory,
      color: '#8b5cf6',
      gradient: ['#a78bfa', '#8b5cf6'],
      route: '/screens/production-line',
    },
    {
      id: 'production',
      title: 'Üretim Süreçleri',
      icon: Settings,
      color: '#f59e0b',
      gradient: ['#fbbf24', '#f59e0b'],
      route: '/screens/production',
    },
    {
      id: 'sales',
      title: 'Satış Kârlılık',
      icon: DollarSign,
      color: '#10b981',
      gradient: ['#34d399', '#10b981'],
      route: '/screens/sales',
    },
    {
      id: 'customers',
      title: 'Müşteri Bilgileri',
      icon: Users,
      color: '#ec4899',
      gradient: ['#f472b6', '#ec4899'],
      route: '/screens/customers',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MRT</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>MRT AI</Text>
            <Text style={styles.headerSubtitle}>Stok Yönetim Sistemi</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => handleNavigation('/screens/settings')}
          >
            <Cog size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
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
                <Icon size={36} color={item.color} strokeWidth={2.5} />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 68,
    height: 68,
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
