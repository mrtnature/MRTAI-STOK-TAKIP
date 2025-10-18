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
import { Plus, Edit2, Trash2, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { getDatabase, checkCriticalStock } from '@/db/database';

type Stock = {
  id: number;
  sku: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  reorder_level: number;
};

export default function StockScreen() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    unit: 'Adet',
    qty: '',
    price: '',
    reorder_level: '',
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      loadStocks();
      checkCriticalStock();
    }
  }, []);

  const loadStocks = async () => {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<Stock>(
        'SELECT * FROM stocks ORDER BY created_at DESC'
      );
      setStocks(result || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const openAddModal = () => {
    setEditingStock(null);
    setFormData({
      sku: '',
      name: '',
      unit: 'Adet',
      qty: '',
      price: '',
      reorder_level: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (stock: Stock) => {
    setEditingStock(stock);
    setFormData({
      sku: stock.sku,
      name: stock.name,
      unit: stock.unit,
      qty: stock.qty.toString(),
      price: stock.price.toString(),
      reorder_level: stock.reorder_level.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      Alert.alert('Hata', 'Ürün adı ve SKU zorunludur!');
      return;
    }

    try {
      const db = getDatabase();
      const qty = parseFloat(formData.qty) || 0;
      const price = parseFloat(formData.price) || 0;
      const reorder_level = parseFloat(formData.reorder_level) || 0;

      if (editingStock) {
        await db.runAsync(
          'UPDATE stocks SET sku=?, name=?, unit=?, qty=?, price=?, reorder_level=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
          [formData.sku, formData.name, formData.unit, qty, price, reorder_level, editingStock.id]
        );
      } else {
        await db.runAsync(
          'INSERT INTO stocks (sku, name, unit, qty, price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
          [formData.sku, formData.name, formData.unit, qty, price, reorder_level]
        );
      }

      setModalVisible(false);
      loadStocks();
      checkCriticalStock();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Stok kaydedilemedi!');
    }
  };

  const handleDelete = (stock: Stock) => {
    Alert.alert(
      'Silme Onayi',
      `${stock.name} silinecek. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              await db.runAsync('DELETE FROM stocks WHERE id=?', [stock.id]);
              loadStocks();
            } catch (error) {
              Alert.alert('Hata', 'Stok silinemedi!');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stok Takip</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Ürün</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Miktar</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Fiyat</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>İşlem</Text>
            </View>

            {stocks.map((stock) => (
              <View key={stock.id} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.tableCell}>{stock.name}</Text>
                  <Text style={styles.tableCellSmall}>{stock.sku}</Text>
                  {stock.qty <= stock.reorder_level && (
                    <View style={styles.warningBadge}>
                      <AlertCircle size={10} color="#f59e0b" />
                      <Text style={styles.warningText}>Kritik</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tableCell, { flex: 1 }]}>{stock.qty}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{stock.price}₺</Text>
                <View style={[{ flex: 1, flexDirection: 'row', gap: 8 }]}>
                  <TouchableOpacity onPress={() => openEditModal(stock)}>
                    <Edit2 size={18} color="#1e40af" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(stock)}>
                    <Trash2 size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>Yeni Stok Ekle</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingStock ? 'Stok Düzenle' : 'Yeni Stok Ekle'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="SKU"
              value={formData.sku}
              onChangeText={(text) => setFormData({ ...formData, sku: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Ürün Adı"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Birim (Adet, Kg, vb.)"
              value={formData.unit}
              onChangeText={(text) => setFormData({ ...formData, unit: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Miktar"
              value={formData.qty}
              onChangeText={(text) => setFormData({ ...formData, qty: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Fiyat"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Minimum Stok Seviyesi"
              value={formData.reorder_level}
              onChangeText={(text) => setFormData({ ...formData, reorder_level: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 13,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  tableCellSmall: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addButton: {
    backgroundColor: '#1e40af',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  warningText: {
    fontSize: 9,
    color: '#f59e0b',
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
    marginBottom: 20,
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
    backgroundColor: '#1e40af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
