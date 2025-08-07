import React, { useEffect, useState } from 'react';
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
import { connectToMQTT, onMQTTMessage, disconnectMQTT, publishSOS } from '../mqttClient';

export default function WorkerDetailScreen({ route }) {
  const { worker } = route.params;
  const [mqttDataMap, setMqttDataMap] = useState({});

  useEffect(() => {
    connectToMQTT();
    onMQTTMessage((data) => {
      setMqttDataMap((prev) => ({
        ...prev,
        [data.hatId]: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      }));
    });
    return () => disconnectMQTT();
  }, []);

  const currentData = mqttDataMap[worker.hatId];
  const heartRate = currentData?.heartRate || 'N/A';
  const workerLocation = currentData?.latitude && currentData?.longitude
    ? {
      latitude: parseFloat(currentData.latitude),
      longitude: parseFloat(currentData.longitude),
    }
    : null;

  const lastUpdated = currentData?.timestamp
    ? new Date(currentData.timestamp).toLocaleString()
    : 'No recent update';

  const handlePing = () => {
    Alert.alert('📡 Pinging Helmet', `Sending ping to helmet ID ${worker.hatId}`);
  };

  const handleSOS = () => {
    if (worker.hatId) {
      publishSOS(worker.hatId);
      Alert.alert('📡 SOS Sent', `SOS sent to helmet ID ${worker.hatId}`);
    } else {
      Alert.alert('⚠️ Error', 'Helmet ID not found');
    }
  };

  const imageSource = worker.image?.startsWith('data:image')
    ? { uri: worker.image }
    : worker.image
      ? { uri: worker.image }
      : { uri: 'http://via.placeholder.com/150' };

  return (
    <View style={styles.container}>
      <Image source={imageSource} style={styles.topRightAvatar} />

      <View style={styles.content}>
        <View>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.subtext}>Role: {worker.role || 'Electrician'}</Text>
          <Text style={styles.subtext}>Nationality: {worker.nationality || 'Unknown'}</Text>
          <Text style={styles.subtext}>Blood Type: {worker.bloodType || '-'}</Text>
          <Text style={styles.subtext}>Age: {worker.age || '-'}</Text>
          <Text style={styles.subtext}>Gender: {worker.gender || '-'}</Text>

          <View style={styles.heartBox}>
            <FontAwesome name="heartbeat" size={24} color="red" />
            <Text style={styles.bpmText}>{heartRate} BPM</Text>
          </View>

          <View style={styles.mapWrapper}>
            <Text style={styles.helmetId}>Helmet ID: {worker.hatId || 'HT-3422'}</Text>
            <Image source={imageSource} style={styles.mapAvatar} />

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: workerLocation?.latitude || 13.736717,
                longitude: workerLocation?.longitude || 100.523186,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {workerLocation && (
                <Marker coordinate={workerLocation} title={worker.name} />
              )}
            </MapView>
          </View>

          <Text style={styles.updatetext}>Last Updated: {lastUpdated}</Text>
        </View>

        <View>
          <TouchableOpacity style={styles.pingButton} onPress={handlePing}>
            <Text style={styles.buttonText}>Ping Hat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Text style={styles.buttonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
    marginTop: 3,
  },
  heartBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingLeft: 10,
  },
  bpmText: {
    fontSize: 24,
    color: 'red',
    fontWeight: '600',
    paddingLeft: 8,
  },
  mapWrapper: {
    position: 'relative',
    height: 380,
    marginTop: 10,
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
    marginTop: 6,
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
