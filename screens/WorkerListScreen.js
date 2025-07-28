import React, { useState, useEffect } from 'react';  
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Button,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WorkerListScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('name');

  useEffect(() => {
    loadWorkers();
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

      // เติม default value ถ้ายังไม่มี
      newData = newData.map(item => ({
        ...item,
        bloodType: item.bloodType || '',
        nationality: item.nationality || '',
        image: item.image || '',
      }));

      Alert.alert(
        'ต้องการดำเนินการอย่างไร?',
        '',
        [
          {
            text: 'เพิ่มใหม่',
            onPress: () => {
              const combined = [...workers];
              newData.forEach((item) => {
                const isDuplicate = combined.some((w) => w.id === item.id && w.name === item.name);
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
        ]
      );
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const filteredWorkers = workers.filter((worker) =>
    worker[searchField]
      ?.toString()
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('WorkerDetails', { worker: item })}
    >
      <Image
        source={{ uri: item.image?.startsWith('data:image') ? item.image : (item.image || 'https://via.placeholder.com/50') }}
        style={styles.avatar}
      />
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>{item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="แก้ไขรายชื่อ" onPress={() => setModalVisible(true)} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`ค้นหาโดย ${searchField === 'name' ? 'ชื่อ' : 'ตำแหน่ง'}`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.searchButtons}>
          <Button title="ค้นหาจากชื่อ" onPress={() => setSearchField('name')} />
          <Button title="ค้นหาจากตำแหน่ง" onPress={() => setSearchField('role')} />
        </View>
      </View>

      {filteredWorkers.length === 0 ? (
        <Text style={{ marginTop: 20, textAlign: 'center', color: '#888' }}>ไม่พบข้อมูล</Text>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Button title="เลือกไฟล์รายชื่อ (.csv หรือ .xlsx)" onPress={handleFilePick} />
          <View style={{ marginTop: 24 }}>
            <Button title="ปิด" onPress={() => setModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function WorkerDetailScreen({ route }) {
  const { worker } = route.params;

  return (
    <View style={styles.detailContainer}>
      <Image
        source={{ uri: worker.image?.startsWith('data:image') ? worker.image : (worker.image || 'https://via.placeholder.com/150') }}
        style={styles.detailImage}
      />
      <Text style={styles.detailName}>{worker.name}</Text>
      <Text style={styles.detailRole}>{worker.role}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  role: {
    color: 'gray',
  },
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
  searchContainer: {
    marginVertical: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 8,
    borderRadius: 5,
  },
  searchButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
