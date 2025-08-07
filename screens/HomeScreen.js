import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker } from 'react-native-maps';
import haversine from 'haversine-distance';
import { connectToMQTT, onMQTTMessage, disconnectMQTT } from '../mqttClient';
import mqtt from 'mqtt';

const MQTT_BROKER = 'ws://ionlypfw.thddns.net:2025';
const TOPIC_SOS = 'soschannel';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [mqttDataMap, setMqttDataMap] = useState({});
  const [selectedHat, setSelectedHat] = useState(null);
  const mapRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }

      Geolocation.getCurrentPosition(
        position => {
          setLocation(position.coords);
        },
        error => {
          console.error(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    connectToMQTT();

    onMQTTMessage((message) => {
      setMqttDataMap(prev => ({
        ...prev,
        [message.hatId]: message
      }));

      if (mapRef.current && message.latitude && message.longitude) {
        mapRef.current.animateToRegion({
          latitude: parseFloat(message.latitude),
          longitude: parseFloat(message.longitude),
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    });

    clientRef.current = mqtt.connect(MQTT_BROKER);

    return () => {
      disconnectMQTT();
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  const getDistance = (target) => {
    if (!location || !target) return null;
    const from = { latitude: location.latitude, longitude: location.longitude };
    const to = { latitude: parseFloat(target.latitude), longitude: parseFloat(target.longitude) };
    const distanceInMeters = haversine(from, to);
    return (distanceInMeters / 1000).toFixed(2);
  };

  const handleNavigate = (target) => {
    if (target?.latitude && target?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleSOS = () => {
    if (clientRef.current) {
      clientRef.current.publish(TOPIC_SOS, 'sos');
      Alert.alert('🚨 SOS Sent', 'ส่งสัญญาณฉุกเฉินไปยังหมวกทุกใบแล้ว');
    }
  };

  const hatIds = Object.keys(mqttDataMap);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: location?.latitude || 13.736717,
          longitude: location?.longitude || 100.523186,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {hatIds.map((hatId) => {
          const data = mqttDataMap[hatId];
          if (!data?.latitude || !data?.longitude) return null;
          return (
            <Marker
              key={hatId}
              coordinate={{
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
              }}
              title={`Helmet ${hatId}`}
              description={selectedHat === hatId && location ? `ห่าง ${getDistance(data)} กม.` : ''}
              pinColor={selectedHat === hatId ? 'blue' : 'red'}
              onPress={() => setSelectedHat(hatId)}
            />
          );
        })}
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.mqttText}>
          จำนวนคนงานในไซต์: {hatIds.length} คน
        </Text>

        {selectedHat && mqttDataMap[selectedHat] && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => handleNavigate(mqttDataMap[selectedHat])}
          >
            <Text style={styles.navigateText}>นำทางไปยังหมวก {selectedHat}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('Workers')}
          >
            <Text style={styles.viewButtonText}>View Workers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 3 },
  infoContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  viewButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
  },
  viewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  sosButton: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
  },
  sosButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mqttText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  navigateButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navigateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
