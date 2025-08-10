import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  RefreshControl,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectToMQTT, onMQTTMessage, disconnectMQTT } from '../mqttClient';
import { Button, Input, Card, StatusBadge, EmptyState } from '../components/UIComponents';
import { theme } from '../theme';
import * as Animatable from 'react-native-animatable';

export default function WorkerListScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [mqttDataMap, setMqttDataMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    connectToMQTT();

    onMQTTMessage((data) => {
      setMqttDataMap((prev) => ({
        ...prev,
        [data.hatId]: data.helmetStatus,
      }));
    });

    return () => {
      disconnectMQTT();
    };
  }, []);

  const loadWorkers = async () => {
    try {
      const stored = await AsyncStorage.getItem('workers');
      if (stored) {
        setWorkers(JSON.parse(stored));
      }
    } catch (error) {
      alert('โหลดข้อมูลล้มเหลว');
    }
  };

  const saveWorkers = async (newData) => {
    try {
      await AsyncStorage.setItem('workers', JSON.stringify(newData));
      setWorkers(newData);
    } catch (error) {
      alert('บันทึกข้อมูลล้มเหลว');
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets) return;

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
        alert('ไฟล์ไม่รองรับ! กรุณาเลือก .csv หรือ .xlsx');
        return;
      }

      newData = newData.map((item) => ({
        hatId: item.hatId?.toString(),
        name: item.name || '',
        role: item.role || '',
        bloodType: item.bloodType || '',
        nationality: item.nationality || '',
        image: item.image || '',
        age: item.age || '',
        gender: item.gender || '',
      }));

      Alert.alert('ต้องการดำเนินการอย่างไร?', '', [
        {
          text: 'เพิ่มใหม่',
          onPress: () => {
            const combined = [...workers];
            newData.forEach((item) => {
              const isDuplicate = combined.some((w) => w.hatId === item.hatId && w.name === item.name);
              if (!isDuplicate) {
                combined.push(item);
              }
            });
            saveWorkers(combined);
          },
        },
        {
          text: 'แทนที่ทั้งหมด',
          onPress: () => saveWorkers(newData),
          style: 'destructive',
        },
        { text: 'ยกเลิก', style: 'cancel' },
      ]);
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkers();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const filteredWorkers = workers.filter((worker) =>
    worker[searchField]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusInfo = (hatId) => {
    const status = mqttDataMap[hatId];
    if (status === '0' || status === 0) {
      return { status: 'normal', text: 'ปกติ', color: theme.colors.status.success };
    } else if (status === '1' || status === 1) {
      return { status: 'sos', text: 'ฉุกเฉิน', color: theme.colors.status.danger };
    } else {
      return { status: 'offline', text: 'ออฟไลน์', color: theme.colors.status.offline };
    }
  };

  const renderWorkerCard = ({ item, index }) => {
    const statusInfo = getStatusInfo(item.hatId);
    
    return (
      <Animatable.View 
        animation="fadeInUp" 
        delay={index * 100}
        duration={600}
      >
        <Card style={styles.workerCard}>
          <TouchableOpacity
            style={styles.workerContent}
            onPress={() => navigation.navigate('WorkerDetails', { worker: item })}
            activeOpacity={0.7}
          >
            <View style={styles.workerInfo}>
              <Image
                source={{
                  uri: item.image?.startsWith('data:image') 
                    ? item.image 
                    : item.image || 'https://via.placeholder.com/60'
                }}
                style={styles.workerAvatar}
              />
              <View style={styles.workerDetails}>
                <Text style={styles.workerName}>{item.name}</Text>
                <Text style={styles.workerRole}>{item.role}</Text>
                <Text style={styles.workerHatId}>หมวก ID: {item.hatId}</Text>
              </View>
            </View>
            
            <View style={styles.workerStatus}>
              <StatusBadge 
                status={statusInfo.status} 
                text={statusInfo.text}
                size="large"
              />
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.text.secondary}
                style={{ marginTop: theme.spacing.xs }}
              />
            </View>
          </TouchableOpacity>
        </Card>
      </Animatable.View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Search Section */}
      <Animatable.View animation="fadeInDown" duration={600}>
        <Card style={styles.searchCard}>
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={24} color={theme.colors.primary} />
            <Text style={styles.searchTitle}>ค้นหาพนักงาน</Text>
          </View>
          
          <Input
            placeholder={`ค้นหาโดย${searchField === 'name' ? 'ชื่อ' : 'ตำแหน่ง'}`}
            icon="search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ marginBottom: theme.spacing.md }}
          />
          
          <View style={styles.filterButtons}>
            <Button
              title="ชื่อ"
              variant={searchField === 'name' ? 'primary' : 'outline'}
              size="small"
              onPress={() => setSearchField('name')}
              style={{ flex: 1, marginRight: theme.spacing.xs }}
            />
            <Button
              title="ตำแหน่ง"
              variant={searchField === 'role' ? 'primary' : 'outline'}
              size="small"
              onPress={() => setSearchField('role')}
              style={{ flex: 1, marginLeft: theme.spacing.xs }}
            />
          </View>
        </Card>
      </Animatable.View>
      
      {/* Stats */}
      <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{workers.length}</Text>
          <Text style={styles.statLabel}>ทั้งหมด</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {workers.filter(w => getStatusInfo(w.hatId).status === 'normal').length}
          </Text>
          <Text style={styles.statLabel}>ปกติ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {workers.filter(w => getStatusInfo(w.hatId).status === 'sos').length}
          </Text>
          <Text style={styles.statLabel}>ฉุกเฉิน</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {workers.filter(w => getStatusInfo(w.hatId).status === 'offline').length}
          </Text>
          <Text style={styles.statLabel}>ออฟไลน์</Text>
        </View>
      </Animatable.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.secondary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={theme.colors.text.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>รายชื่อพนักงาน</Text>
            <Text style={styles.headerSubtitle}>จัดการข้อมูลพนักงาน</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={28} color={theme.colors.text.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      {filteredWorkers.length === 0 && workers.length === 0 ? (
        <EmptyState
          icon="people"
          title="ไม่มีข้อมูลพนักงาน"
          subtitle="เริ่มต้นโดยการเพิ่มไฟล์รายชื่อพนักงาน"
          actionButton={
            <Button
              title="เพิ่มรายชื่อ"
              icon="add"
              onPress={() => setModalVisible(true)}
              style={{ marginTop: theme.spacing.lg }}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item, index) => item.hatId?.toString() || index.toString()}
          renderItem={renderWorkerCard}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <Animatable.View animation="fadeInUp" duration={600}>
              <EmptyState
                icon="search"
                title="ไม่พบผลการค้นหา"
                subtitle={`ไม่พบพนักงานที่มี${searchField === 'name' ? 'ชื่อ' : 'ตำแหน่ง'} "${searchQuery}"`}
              />
            </Animatable.View>
          )}
        />
      )}

      {/* Import Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เพิ่มรายชื่อพนักงาน</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              เลือกไฟล์ CSV หรือ Excel ที่มีข้อมูลพนักงาน
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="เลือกไฟล์"
                icon="document"
                onPress={handleFilePick}
                style={{ marginBottom: theme.spacing.md }}
              />
              <Button
                title="ยกเลิก"
                variant="outline"
                onPress={() => setModalVisible(false)}
              />
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.white,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.white,
    opacity: 0.9
  },
  addButton: {
    padding: theme.spacing.xs
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl
  },
  searchCard: {
    marginBottom: theme.spacing.lg
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  searchTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md
  },
  filterButtons: {
    flexDirection: 'row'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: 'bold'
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4
  },
  workerCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg
  },
  workerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: theme.spacing.md
  },
  workerDetails: {
    flex: 1
  },
  workerName: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4
  },
  workerRole: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: 4
  },
  workerHatId: {
    ...theme.typography.caption,
    color: theme.colors.text.light,
    fontWeight: '500'
  },
  workerStatus: {
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.shadow.dark,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    minHeight: 280
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary
  },
  modalDescription: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24
  },
  modalButtons: {
    gap: theme.spacing.md
  },
  // Legacy styles for WorkerDetailScreen
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
  }
});
