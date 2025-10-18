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
import { Plus, X } from 'lucide-react-native';
import { getDatabase, checkCriticalStock } from '@/db/database';

type Stock = {
  id: number;
  name: string;
  unit: string;
  price: number;
  qty: number;
};

type Template = {
  id: number;
  name: string;
  total_cost: number;
};

type TemplateItem = {
  stock_id: number;
  qty: number;
  unit_price: number;
  subtotal: number;
};

type Customer = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
};

export default function ProductionScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [produceModalVisible, setProduceModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [customerData, setCustomerData] = useState<Customer>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    loadTemplates();
    loadStocks();
  }, []);

  const loadTemplates = async () => {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<Template>(
        'SELECT * FROM templates ORDER BY created_at DESC'
      );
      setTemplates(result || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadStocks = async () => {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<Stock>('SELECT * FROM stocks');
      setStocks(result || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const openAddTemplateModal = () => {
    setTemplateName('');
    setTemplateItems([]);
    setModalVisible(true);
  };

  const addTemplateItem = () => {
    if (stocks.length === 0) {
      Alert.alert('Hata', 'Stokta ürün bulunamadı!');
      return;
    }
    setTemplateItems([
      ...templateItems,
      {
        stock_id: stocks[0].id,
        qty: 1,
        unit_price: stocks[0].price,
        subtotal: stocks[0].price,
      },
    ]);
  };

  const removeTemplateItem = (index: number) => {
    const newItems = [...templateItems];
    newItems.splice(index, 1);
    setTemplateItems(newItems);
  };

  const updateTemplateItem = (index: number, field: string, value: any) => {
    const newItems = [...templateItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'stock_id') {
      const stock = stocks.find((s) => s.id === parseInt(value));
      if (stock) {
        newItems[index].unit_price = stock.price;
        newItems[index].subtotal = newItems[index].qty * stock.price;
      }
    } else if (field === 'qty' || field === 'unit_price') {
      newItems[index].subtotal = newItems[index].qty * newItems[index].unit_price;
    }

    setTemplateItems(newItems);
  };

  const calculateTotalCost = () => {
    return templateItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert('Hata', 'Şablon adı giriniz!');
      return;
    }

    if (templateItems.length === 0) {
      Alert.alert('Hata', 'En az bir ürün ekleyiniz!');
      return;
    }

    try {
      const db = getDatabase();
      const totalCost = calculateTotalCost();

      const result = await db.runAsync(
        'INSERT INTO templates (name, total_cost) VALUES (?, ?)',
        [templateName, totalCost]
      );

      const templateId = result.lastInsertRowId;

      for (const item of templateItems) {
        await db.runAsync(
          'INSERT INTO template_items (template_id, stock_id, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [templateId, item.stock_id, item.qty, item.unit_price, item.subtotal]
        );
      }

      setModalVisible(false);
      loadTemplates();
      Alert.alert('Başarılı', 'Şablon kaydedildi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Şablon kaydedilemedi!');
    }
  };

  const openProduceModal = (template: Template) => {
    setSelectedTemplate(template);
    setCustomerData({
      full_name: '',
      phone: '',
      email: '',
      address: '',
    });
    setSellPrice(template.total_cost.toString());
    setProduceModalVisible(true);
  };

  const produceOrder = async () => {
    if (!selectedTemplate) return;

    if (!customerData.full_name.trim()) {
      Alert.alert('Hata', 'Müşteri adı giriniz!');
      return;
    }

    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Hata', 'Geçerli bir satış fiyatı giriniz!');
      return;
    }

    try {
      const db = getDatabase();

      // Şablon kalemlerini al
      const items = await db.getAllAsync<{ stock_id: number; qty: number }>(
        'SELECT stock_id, qty FROM template_items WHERE template_id=?',
        [selectedTemplate.id]
      );

      // Stok kontrolü
      for (const item of items) {
        const stock = await db.getFirstAsync<{ name: string; qty: number }>(
          'SELECT name, qty FROM stocks WHERE id=?',
          [item.stock_id]
        );

        if (stock && stock.qty < item.qty) {
          Alert.alert(
            'Yetersiz Stok',
            `${stock.name} için yetersiz stok! Mevcut: ${stock.qty}, Gerekli: ${item.qty}`
          );
          return;
        }
      }

      // Müşteriyi kaydet
      const customerResult = await db.runAsync(
        'INSERT INTO customers (full_name, phone, email, address) VALUES (?, ?, ?, ?)',
        [customerData.full_name, customerData.phone, customerData.email, customerData.address]
      );

      const customerId = customerResult.lastInsertRowId;

      // Sipariş oluştur
      const orderResult = await db.runAsync(
        'INSERT INTO orders (template_id, customer_id, sell_price, status) VALUES (?, ?, ?, ?)',
        [selectedTemplate.id, customerId, price, 'ORDER_RECEIVED']
      );

      const orderId = orderResult.lastInsertRowId;

      // Durum geçmişi
      await db.runAsync(
        'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
        [orderId, 'ORDER_RECEIVED', 'Sipariş alındı']
      );

      // Stoktan düş
      for (const item of items) {
        await db.runAsync(
          'UPDATE stocks SET qty = qty - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [item.qty, item.stock_id]
        );
      }

      setProduceModalVisible(false);
      Alert.alert('Başarılı', 'Üretim başlatıldı ve sipariş oluşturuldu!');
      checkCriticalStock();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Üretim başlatılamadı!');
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
            <Text style={styles.cardTitle}>Üretim</Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openAddTemplateModal}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Şablon Ekle</Text>
          </TouchableOpacity>

          <View style={styles.templateList}>
            {templates.map((template) => (
              <View key={template.id} style={styles.templateItem}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateCost}>
                    Maliyet: {template.total_cost.toFixed(2)} TL
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.produceButton}
                  onPress={() => openProduceModal(template)}
                >
                  <Text style={styles.produceButtonText}>Üret</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Şablon Ekle Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Yeni Üretim Şablonu</Text>

              <TextInput
                style={styles.input}
                placeholder="Şablon Adı"
                value={templateName}
                onChangeText={setTemplateName}
              />

              <Text style={styles.sectionTitle}>Ürünler</Text>

              {templateItems.map((item, index) => {
                const selectedStock = stocks.find((s) => s.id === item.stock_id);
                return (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemFields}>
                      <Text style={styles.itemLabel}>Ürün:</Text>
                      <View style={styles.pickerContainer}>
                        <Text style={styles.pickerText}>
                          {selectedStock ? selectedStock.name : 'Ürün seç'}
                        </Text>
                      </View>

                      <TextInput
                        style={[styles.input, styles.smallInput]}
                        placeholder="Miktar"
                        value={item.qty.toString()}
                        onChangeText={(text) =>
                          updateTemplateItem(index, 'qty', parseFloat(text) || 0)
                        }
                        keyboardType="numeric"
                      />

                      <Text style={styles.itemLabel}>
                        Birim Fiyat: {item.unit_price.toFixed(2)} TL
                      </Text>
                      <Text style={styles.itemLabel}>
                        Ara Toplam: {item.subtotal.toFixed(2)} TL
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeTemplateItem(index)}>
                      <X size={24} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity style={styles.addItemButton} onPress={addTemplateItem}>
                <Plus size={16} color="#1e40af" />
                <Text style={styles.addItemButtonText}>Ürün Ekle</Text>
              </TouchableOpacity>

              <Text style={styles.totalCost}>
                Toplam Maliyet: {calculateTotalCost().toFixed(2)} TL
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveTemplate}
                >
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Üretim Modal */}
      <Modal
        visible={produceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProduceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Üretim Başlat</Text>

              <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad *"
                value={customerData.full_name}
                onChangeText={(text) => setCustomerData({ ...customerData, full_name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Telefon"
                value={customerData.phone}
                onChangeText={(text) => setCustomerData({ ...customerData, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                value={customerData.email}
                onChangeText={(text) => setCustomerData({ ...customerData, email: text })}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Adres"
                value={customerData.address}
                onChangeText={(text) => setCustomerData({ ...customerData, address: text })}
                multiline
              />

              <Text style={styles.sectionTitle}>Satış Fiyatı</Text>
              <TextInput
                style={styles.input}
                placeholder="Satış Fiyatı (TL)"
                value={sellPrice}
                onChangeText={setSellPrice}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setProduceModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={produceOrder}
                >
                  <Text style={styles.saveButtonText}>Üret</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  addButton: {
    backgroundColor: '#1e40af',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  templateList: {
    gap: 12,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  templateCost: {
    fontSize: 14,
    color: '#64748b',
  },
  produceButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  produceButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 8,
  },
  itemFields: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#1e293b',
  },
  smallInput: {
    marginBottom: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e40af',
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  addItemButtonText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
  },
  totalCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginTop: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
