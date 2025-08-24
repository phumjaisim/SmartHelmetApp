import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectToMQTT, onMQTTMessage } from '../mqttClient';
import { formatHelmetStatus, validateWorkerData, safeJsonParse } from '../utils';

const { width } = Dimensions.get('window');

const WorkerListScreen = React.memo(({ navigation }) => {
  const [workers, setWorkers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [mqttDataMap, setMqttDataMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  useEffect(() => {
    const initializeMQTT = async () => {
      try {
        await connectToMQTT();
        
        const unsubscribe = onMQTTMessage((data) => {
          setMqttDataMap((prev) => {
            const prevData = prev[data.hatId];
            if (prevData && 
                prevData.helmetStatus === data.helmetStatus && 
                prevData.heartRate === data.heartRate) {
              return prev; // No change, prevent re-render
            }
            return {
              ...prev,
              [data.hatId]: {
                helmetStatus: data.helmetStatus,
                heartRate: data.heartRate, // Keep original value (including 0, null, undefined)
                timestamp: new Date().toISOString(),
              },
            };
          });
        });

        return unsubscribe;
      } catch (error) {
        console.error('MQTT connection error:', error);
      }
    };

    let cleanupFn = null;
    initializeMQTT().then(cleanup => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, []);

  const loadWorkers = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem('workers');
      if (stored) {
        const parsedWorkers = safeJsonParse(stored, []);
        // Validate and normalize worker data
        const validatedWorkers = parsedWorkers.map(validateWorkerData);
        setWorkers(validatedWorkers);
      }
    } catch (error) {
      console.error('Load workers error:', error);
      Alert.alert('ข้อผิดพลาด', 'โหลดข้อมูลล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveWorkers = useCallback(async (newData) => {
    try {
      await AsyncStorage.setItem('workers', JSON.stringify(newData));
      setWorkers(newData);
    } catch (error) {
      console.error('Save workers error:', error);
      Alert.alert('ข้อผิดพลาด', 'บันทึกข้อมูลล้มเหลว');
    }
  }, []);

  const handleFilePick = useCallback(async () => {
    try {
      setIsProcessingFile(true);
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets) {
        setIsProcessingFile(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;
      let newData = [];

      if (fileName.endsWith('.csv')) {
        const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
        newData = parsed.data;
      } else if (fileName.endsWith('.xlsx')) {
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const workbook = XLSX.read(base64, { type: 'base64' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        newData = XLSX.utils.sheet_to_json(sheet);
      } else {
        Alert.alert('ไฟล์ไม่รองรับ', 'กรุณาเลือก .csv หรือ .xlsx');
        setIsProcessingFile(false);
        return;
      }

      // Validate and normalize imported data
      newData = newData.map(validateWorkerData);

      const handleAddData = () => {
        const combined = [...workers];
        newData.forEach((item) => {
          const isDuplicate = combined.some((w) => w.hatId === item.hatId && w.name === item.name);
          if (!isDuplicate) {
            combined.push(item);
          }
        });
        saveWorkers(combined);
      };

      const handleReplaceData = () => {
        saveWorkers(newData);
      };

      Alert.alert(
        'Import Data',
        'How would you like to proceed?',
        [
          { text: 'Add New', onPress: handleAddData },
          { text: 'Replace All', onPress: handleReplaceData, style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('File processing error:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsProcessingFile(false);
    }
  }, [workers, saveWorkers]);

  // Memoized filtered workers for performance
  const filteredWorkers = useMemo(() => 
    workers.filter((worker) =>
      worker[searchField]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    ), 
    [workers, searchField, searchQuery]
  );

  // Memoized render item for FlatList performance
  const renderItem = useCallback(({ item }) => {
    const mqttData = mqttDataMap[item.hatId];
    
    // Use real-time heartRate data directly - old algorithm
    let heartRate = 'N/A';
    if (mqttData && mqttData.heartRate !== undefined && mqttData.heartRate !== null) {
      heartRate = mqttData.heartRate;
      // If it's 0, keep it as 0
      if (heartRate === 0) {
        heartRate = '0';
      }
    }
    
    const status = mqttData?.helmetStatus;
    const { text: statusText, color } = formatHelmetStatus(status);
    
    const isConnected = !!mqttData;
    
    // Original heartbeat status logic
    let heartRateStatus = 'unknown';
    if (heartRate !== 'N/A' && heartRate !== '0') {
      const bpm = parseInt(heartRate);
      if (bpm >= 60 && bpm <= 100) {
        heartRateStatus = 'normal';
      } else {
        heartRateStatus = 'warning';
      }
    } else if (heartRate === '0') {
      heartRateStatus = 'warning'; // 0 BPM is concerning
    }
    
    // Check for SOS mode
    const isSOS = status === 'SOS' || statusText === 'SOS';
    const isEmergency = isSOS || status === 'EMERGENCY';
    
    // Determine status display
    let displayStatus = 'Offline';
    let statusColor = '#9e9e9e'; // Grey for offline
    
    if (isConnected) {
      if (isEmergency) {
        displayStatus = 'SOS';
        statusColor = '#ff1744'; // Red for SOS
      } else {
        displayStatus = 'Online';
        statusColor = '#4caf50'; // Green for online
      }
    }

    return (
      <TouchableOpacity
        style={[styles.workerCard, isEmergency && styles.workerCardEmergency]}
        onPress={() => navigation.navigate('WorkerDetails', { worker: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Image
            source={{
              uri: item.image?.startsWith('data:image') ? item.image : item.image || 'https://via.placeholder.com/60',
            }}
            style={[styles.workerAvatar, isEmergency && styles.workerAvatarEmergency]}
          />
          
          <View style={styles.workerInfo}>
            <View style={styles.workerNameRow}>
              <Text style={[styles.workerName, isEmergency && styles.workerNameEmergency]}>{item.name}</Text>
              <View style={styles.heartRateContainer}>
                <FontAwesome 
                  name="heartbeat" 
                  size={14} 
                  color={heartRateStatus === 'warning' ? '#ff9800' : heartRateStatus === 'normal' ? '#4caf50' : '#9e9e9e'} 
                />
                <Text style={styles.heartRateText}>{heartRate}</Text>
              </View>
            </View>
            
            <View style={styles.workerDetailsRow}>
              <View style={styles.roleContainer}>
                <Ionicons name="briefcase" size={14} color="#666" />
                <Text style={styles.workerRole}>{item.role || 'Worker'}</Text>
              </View>
              
              <View style={styles.helmetContainer}>
                <Text style={styles.helmetId}>HELMET ID: </Text>
                <Text style={styles.helmetId}>{item.hatId || 'N/A'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statusIndicator}>
            <View style={[styles.connectionDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.connectionText, { color: isEmergency ? statusColor : '#666' }]}>
              {displayStatus}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [mqttDataMap, navigation]);

  const keyExtractor = useCallback((item, index) => 
    item.hatId?.toString() || index.toString(), []
  );

  if (isLoading) {
    return (
      <View style={styles.modernContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
        <LinearGradient
          colors={['#1a237e', '#3949ab']}
          style={styles.loadingHeader}
        >
          <Text style={styles.loadingHeaderText}>Smart Helmet Monitor</Text>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.modernLoadingText}>Loading workers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Modern Header */}
      <LinearGradient
        colors={['#1a237e', '#3949ab']}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="groups" size={32} color="white" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Workers</Text>
              <Text style={styles.headerSubtitle}>{filteredWorkers.length} total</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            disabled={isProcessingFile}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Modern Search */}
      <View style={styles.modernSearchContainer}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.modernSearchInput}
            placeholder={`Search by ${searchField === 'name' ? 'name' : 'role'}...`}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, searchField === 'name' && styles.filterButtonActive]}
            onPress={() => setSearchField('name')}
          >
            <Ionicons name="person" size={16} color={searchField === 'name' ? 'white' : '#666'} />
            <Text style={[styles.filterButtonText, searchField === 'name' && styles.filterButtonTextActive]}>
              Name
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, searchField === 'role' && styles.filterButtonActive]}
            onPress={() => setSearchField('role')}
          >
            <Ionicons name="briefcase" size={16} color={searchField === 'role' ? 'white' : '#666'} />
            <Text style={[styles.filterButtonText, searchField === 'role' && styles.filterButtonTextActive]}>
              Role
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Workers List */}
      <View style={styles.listContainer}>
        {filteredWorkers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="groups" size={64} color="#ddd" />
            <Text style={styles.emptyStateText}>No workers found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Import worker data to get started'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWorkers}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />
        )}
      </View>

      {/* Modern Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modernModalOverlay}>
          <View style={styles.modernModalContainer}>
            {isProcessingFile && (
              <View style={styles.modernProcessingOverlay}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text style={styles.modernProcessingText}>Processing file...</Text>
              </View>
            )}
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Workers</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                disabled={isProcessingFile}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.importButton}
                onPress={handleFilePick}
                disabled={isProcessingFile}
              >
                <LinearGradient
                  colors={['#2196f3', '#1976d2']}
                  style={styles.importButtonGradient}
                >
                  <MaterialIcons name="upload-file" size={24} color="white" />
                  <Text style={styles.importButtonText}>Select File (.csv or .xlsx)</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <Text style={styles.modalDescription}>
                Import worker data from CSV or Excel files. You can choose to add new workers or replace existing data.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default WorkerListScreen;

export function WorkerDetailScreen({ route }) {
  const { worker } = route.params;

  return (
    <View style={styles.detailContainer}>
      <Image
        source={{ uri: worker.image?.startsWith('data:image') ? worker.image : worker.image || 'https://via.placeholder.com/150' }}
        style={styles.detailImage}
      />
      <Text style={styles.detailName}>{worker.name}</Text>
      <Text style={styles.detailRole}>{worker.role}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Modern Container
  modernContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Loading Styles
  loadingHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  loadingHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  
  // Modern Header
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e8eaf6',
    marginTop: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modern Search
  modernSearchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  modernSearchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#1976d2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  
  // List Container
  listContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  // Worker Cards
  workerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  heartRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  heartRateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  workerDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  workerRole: {
    fontSize: 14,
    color: '#666',
  },
  helmetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helmetId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  statusIndicator: {
    alignItems: 'center',
    marginLeft: 12,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  connectionText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  
  // Emergency/SOS Styles
  workerCardEmergency: {
    borderWidth: 2,
    borderColor: '#ff1744',
    backgroundColor: '#fff5f5',
  },
  workerAvatarEmergency: {
    borderColor: '#ff1744',
    borderWidth: 3,
  },
  workerNameEmergency: {
    color: '#d32f2f',
  },
  emergencyPulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyPulseRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff1744',
    opacity: 0.6,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Modern Modal
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxWidth: width - 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  importButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  importButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  modernProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    zIndex: 1000,
  },
  modernProcessingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  // Legacy styles (kept for compatibility)
  detailContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  detailImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailRole: {
    fontSize: 20,
    color: 'gray',
  },
});
