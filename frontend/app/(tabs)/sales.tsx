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
} from 'react-native';
import { useEffect, useState } from 'react';
import { getDatabase } from '@/db/database';
import * as MailComposer from 'expo-mail-composer';

type Order = {
  id: number;
  customer_name: string;
  template_name: string;
  sell_price: number;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [cargoModalVisible, setCargoModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cargoCompany, setCargoCompany] = useState('');
  const [cargoTracking, setCargoTracking] = useState('');

  useEffect(() => {
    loadOrders();
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

              // E-posta gönder
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

      // E-posta gönder
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Management</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Satış & Kârlılık</Text>
          </View>

          {orders.length === 0 ? (
            <Text style={styles.emptyText}>Henüz sipariş bulunmuyor</Text>
          ) : (
            orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              return (
                <View key={order.id} style={styles.orderItem}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderCustomer}>{order.customer_name}</Text>
                    <Text style={styles.orderProduct}>{order.template_name}</Text>
                    <Text style={styles.orderPrice}>Fiyat: {order.sell_price.toFixed(2)} TL</Text>
                    {order.cargo_company && (
                      <Text style={styles.orderCargo}>
                        Kargo: {order.cargo_company} ({order.cargo_tracking})
                      </Text>
                    )}
                  </View>

                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_COLORS[order.status] },
                      ]}
                    >
                      <Text style={styles.statusText}>{STATUS_MAP[order.status]}</Text>
                    </View>

                    {nextStatus && (
                      <TouchableOpacity
                        style={styles.nextButton}
                        onPress={() => updateOrderStatus(order, nextStatus)}
                      >
                        <Text style={styles.nextButtonText}>İlerlet</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Kargo Bilgisi Modal */}
      <Modal
        visible={cargoModalVisible}
        animationType="slide"
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
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 16,
    paddingVertical: 32,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  orderProduct: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  orderCargo: {
    fontSize: 12,
    color: '#8b5cf6',
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
    padding: 12,
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
    backgroundColor: '#1e40af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
