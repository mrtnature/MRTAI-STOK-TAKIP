import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { getDatabase } from '@/db/database';
import * as MailComposer from 'expo-mail-composer';

type Order = {
  id: number;
  customer_name: string;
  template_name: string;
  sell_price: number;
  total_cost: number;
  profit: number;
  status: string;
  cargo_company: string | null;
  cargo_tracking: string | null;
  customer_email: string | null;
};

const STATUS_MAP: { [key: string]: string } = {
  ORDER_RECEIVED: 'Sipariş Alındı',
  IN_PRODUCTION: 'Üretimde',
  SHIPPED: 'Kargoya Verildi',
  COMPLETED: 'Tamamlandı',
};

const STATUS_COLORS: { [key: string]: string } = {
  ORDER_RECEIVED: '#3b82f6',
  IN_PRODUCTION: '#f59e0b',
  SHIPPED: '#8b5cf6',
  COMPLETED: '#10b981',
};

export default function SalesScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [cargoModalVisible, setCargoModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cargoCompany, setCargoCompany] = useState('');
  const [cargoTracking, setCargoTracking] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      loadOrders();
    }
  }, []);

  const loadOrders = async () => {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<Order>(`
        SELECT 
          o.id,
          c.full_name as customer_name,
          c.email as customer_email,
          t.name as template_name,
          o.sell_price,
          t.total_cost,
          (o.sell_price - t.total_cost) as profit,
          o.status,
          o.cargo_company,
          o.cargo_tracking
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        JOIN templates t ON o.template_id = t.id
        ORDER BY o.created_at DESC
      `);
      setOrders(result || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    if (newStatus === 'SHIPPED') {
      setSelectedOrder(order);
      setCargoCompany(order.cargo_company || '');
      setCargoTracking(order.cargo_tracking || '');
      setCargoModalVisible(true);
      return;
    }

    Alert.alert(
      'Durum Güncelleme',
      `Sipariş durumunu "${STATUS_MAP[newStatus]}" olarak güncellemek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            try {
              const db = getDatabase();
              await db.runAsync(
                'UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
                [newStatus, order.id]
              );
              await db.runAsync(
                'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
                [order.id, newStatus, `Durum güncellendi: ${STATUS_MAP[newStatus]}`]
              );
              loadOrders();

              if (order.customer_email && newStatus === 'COMPLETED') {
                sendEmail(order, newStatus);
              }
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Durum güncellenemedi!');
            }
          },
        },
      ]
    );
  };

  const saveCargoInfo = async () => {
    if (!selectedOrder) return;

    if (!cargoCompany.trim() || !cargoTracking.trim()) {
      Alert.alert('Hata', 'Kargo şirketi ve takip numarası gereklidir!');
      return;
    }

    try {
      const db = getDatabase();
      await db.runAsync(
        'UPDATE orders SET status=?, cargo_company=?, cargo_tracking=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        ['SHIPPED', cargoCompany, cargoTracking, selectedOrder.id]
      );
      await db.runAsync(
        'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
        [
          selectedOrder.id,
          'SHIPPED',
          `Kargoya verildi - ${cargoCompany} (${cargoTracking})`,
        ]
      );
      setCargoModalVisible(false);
      loadOrders();

      if (selectedOrder.customer_email) {
        sendEmail({ ...selectedOrder, cargo_company: cargoCompany, cargo_tracking: cargoTracking }, 'SHIPPED');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Kargo bilgileri kaydedilemedi!');
    }
  };

  const sendEmail = async (order: Order, status: string) => {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Bilgi', 'Cihazda e-posta istemcisi bulunamadı');
        return;
      }

      let body = `Merhaba ${order.customer_name},\n\n`;
      body += `Siparişiniz (${order.template_name}) hakkında bilgilendirme:\n\n`;

      if (status === 'SHIPPED') {
        body += `Siparişiniz kargoya verilmiştir.\n`;
        body += `Kargo Şirketi: ${order.cargo_company}\n`;
        body += `Takip Numarası: ${order.cargo_tracking}\n\n`;
      } else if (status === 'COMPLETED') {
        body += `Siparişiniz tamamlanmıştır.\n`;
        body += `Bizi tercih ettiğiniz için teşekkür ederiz.\n\n`;
      }

      body += 'Saygılarımızla,\nERP-STOK';

      await MailComposer.composeAsync({
        recipients: [order.customer_email!],
        subject: `Sipariş Durumu: ${STATUS_MAP[status]}`,
        body,
      });
    } catch (error) {
      console.error('Email error:', error);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = ['ORDER_RECEIVED', 'IN_PRODUCTION', 'SHIPPED', 'COMPLETED'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const getTotalStats = () => {
    const totalSales = orders.reduce((sum, o) => sum + o.sell_price, 0);
    const totalCost = orders.reduce((sum, o) => sum + o.total_cost, 0);
    const totalProfit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0';

    return { totalSales, totalCost, totalProfit, profitMargin };
  };

  const stats = getTotalStats();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Satış Kârlılık</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Toplam Satış</Text>
            <Text style={styles.statValue}>{stats.totalSales.toFixed(0)}₺</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Toplam Kâr</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {stats.totalProfit.toFixed(0)}₺
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Kâr Marjı</Text>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              %{stats.profitMargin}
            </Text>
          </View>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Henüz sipariş bulunmuyor</Text>
          </View>
        ) : (
          orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const profitPercent = ((order.profit / order.sell_price) * 100).toFixed(1);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderCustomer}>{order.customer_name}</Text>
                    <Text style={styles.orderProduct}>{order.template_name}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_COLORS[order.status] },
                    ]}
                  >
                    <Text style={styles.statusText}>{STATUS_MAP[order.status]}</Text>
                  </View>
                </View>

                <View style={styles.financials}>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Satış:</Text>
                    <Text style={styles.financialValue}>{order.sell_price.toFixed(2)}₺</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Maliyet:</Text>
                    <Text style={styles.financialValue}>{order.total_cost.toFixed(2)}₺</Text>
                  </View>
                  <View style={[styles.financialRow, styles.profitRow]}>
                    <Text style={[styles.financialLabel, styles.profitLabel]}>Kâr:</Text>
                    <Text style={[styles.financialValue, styles.profitValue]}>
                      {order.profit.toFixed(2)}₺ ({profitPercent}%)
                    </Text>
                  </View>
                </View>

                {order.cargo_company && (
                  <View style={styles.cargoInfo}>
                    <Text style={styles.cargoText}>
                      📦 {order.cargo_company} ({order.cargo_tracking})
                    </Text>
                  </View>
                )}

                {nextStatus && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => updateOrderStatus(order, nextStatus)}
                  >
                    <Text style={styles.nextButtonText}>
                      İlerlet: {STATUS_MAP[nextStatus]}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={cargoModalVisible}
        animationType=\"slide\"
        transparent={true}
        onRequestClose={() => setCargoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kargo Bilgileri</Text>

            <TextInput
              style={styles.input}
              placeholder="Kargo Şirketi"
              value={cargoCompany}
              onChangeText={setCargoCompany}
            />
            <TextInput
              style={styles.input}
              placeholder="Takip Numarası"
              value={cargoTracking}
              onChangeText={setCargoTracking}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCargoModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveCargoInfo}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#10b981',
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  orderProduct: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  financials: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  financialLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  profitRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  profitLabel: {
    fontWeight: '700',
    color: '#10b981',
  },
  profitValue: {
    fontWeight: '700',
    color: '#10b981',
  },
  cargoInfo: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  cargoText: {
    fontSize: 13,
    color: '#1e40af',
  },
  nextButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
