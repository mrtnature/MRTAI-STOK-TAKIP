import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, Pause, AlertTriangle } from 'lucide-react-native';

export default function ProductionLineScreen() {
  const router = useRouter();

  const productionLines = [
    {
      id: 1,
      name: 'Band 1 - Elektronik Montaj',
      status: 'active',
      currentProduct: 'Laptop',
      progress: 75,
      workers: 8,
    },
    {
      id: 2,
      name: 'Band 2 - Aksesuar Üretimi',
      status: 'active',
      currentProduct: 'Mouse',
      progress: 45,
      workers: 5,
    },
    {
      id: 3,
      name: 'Band 3 - Kalite Kontrol',
      status: 'paused',
      currentProduct: 'Monitor',
      progress: 30,
      workers: 4,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Üretim Bandı</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {productionLines.map((line) => (
          <View key={line.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{line.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      line.status === 'active' ? '#10b981' : '#f59e0b',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {line.status === 'active' ? 'Çalışıyor' : 'Durdu'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Üretilen Ürün:</Text>
              <Text style={styles.infoValue}>{line.currentProduct}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Çalışan Sayısı:</Text>
              <Text style={styles.infoValue}>{line.workers} Kişi</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Tamamlanma:</Text>
                <Text style={styles.progressValue}>{line.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${line.progress}%`,
                      backgroundColor:
                        line.status === 'active' ? '#10b981' : '#f59e0b',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  line.status === 'active'
                    ? styles.pauseButton
                    : styles.playButton,
                ]}
              >
                {line.status === 'active' ? (
                  <>
                    <Pause size={20} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Duraklat</Text>
                  </>
                ) : (
                  <>
                    <Play size={20} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Başlat</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>Detaylar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.alertCard}>
          <AlertTriangle size={24} color="#f59e0b" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Dikkat!</Text>
            <Text style={styles.alertText}>
              Band 3'te kalite kontrol süresinde gecikme var. Lütfen kontrol
              ediniz.
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
    backgroundColor: '#8b5cf6',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  playButton: {
    backgroundColor: '#10b981',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  detailsButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});
