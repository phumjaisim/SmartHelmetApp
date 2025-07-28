// WorkerDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';

export default function WorkerDetailScreen({ route }) {
  const { worker } = route.params;

  const workerLocation = {
    latitude: 13.777687813454191,
    longitude: 100.76537895334587,
  };

  const handlePing = () => {
    Alert.alert('📡 Pinging Helmet', `Sending ping to helmet ID ${worker.helmetId}`);
  };

  const sos = () => {
    Alert.alert('📡 SOS', `Sending SOS helmet ID ${worker.helmetId}`);
  };

  // รองรับทั้ง base64 และ URL
  const imageSource = worker.imageBase64
    ? { uri: `data:image/jpeg;base64,${worker.imageBase64}` }
    : worker.imageUrl
      ? { uri: worker.imageUrl }
      : { uri: 'https://via.placeholder.com/150' };

  return (
    <View style={styles.container}>
      {/* รูปใหญ่ด้านบน */}
      <Image source={imageSource} style={styles.topRightAvatar} />

      <View style={styles.content}>
        <Text style={styles.name}>{worker.name}</Text>
        <Text style={styles.subtext}>Role: {worker.role || 'Electrician'}</Text>
        <Text style={styles.subtext}>Nationality: {worker.nationality || 'Unknown'}</Text>
        <Text style={styles.subtext}>Blood Type: {worker.bloodType || '-'}</Text>

        <View style={styles.heartBox}>
          <FontAwesome name="heartbeat" size={24} color="red" />
          <Text style={styles.bpmText}>72 BPM</Text>
        </View>

        <View style={styles.mapWrapper}>
          <Text style={styles.helmetId}>Helmet ID: {worker.helmetId || 'HT-3422'}</Text>

          {/* รูปมุมขวาบนแผนที่ */}
          <Image source={imageSource} style={styles.mapAvatar} />

          <MapView
            style={styles.map}
            initialRegion={{
              ...workerLocation,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }}
          >
            <Marker coordinate={workerLocation} title={worker.name} />
          </MapView>
        </View>

        <Text style={styles.updatetext}>Last Updated: {worker.lastUpdated || 'Just now'}</Text>

        <TouchableOpacity style={styles.pingButton} onPress={handlePing}>
          <Text style={styles.buttonText}>Ping Hat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sosButton} onPress={sos}>
          <Text style={styles.buttonText}>SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// สไตล์คงเดิม
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topRightAvatar: {
    width: 180,
    height: 180,
    borderRadius: 3,
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'black',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 18,
    marginTop: 4,
  },
  heartBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingLeft: 10,
  },
  bpmText: {
    fontSize: 25,
    color: 'red',
    fontWeight: '600',
    paddingLeft: 8,
  },
  mapWrapper: {
    position: 'relative',
    height: 250,
    marginTop: 30,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  helmetId: {
    position: 'absolute',
    top: 8,
    left: 12,
    zIndex: 2,
    backgroundColor: '#ffffffcc',
    padding: 6,
    borderRadius: 8,
    fontWeight: '600',
  },
  mapAvatar: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: '#fff',
    borderWidth: 2,
  },
  pingButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    marginTop: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  sosButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 14,
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  updatetext: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});
