import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker } from 'react-native-maps';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);

  const testLocation1 = {
    latitude: 13.777687813454191,
    longitude: 100.76567895334587,
  };

  const testLocation2 = {
    latitude: 13.777641413286592,
    longitude: 100.76597818652411,
  };

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
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([testLocation1, testLocation2], {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, []);

  const handleSOS = () => {
    Alert.alert('🚨 SOS Triggered', 'This is a mock SOS alert.');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
      >
        <Marker
          coordinate={testLocation1}
          title="Test Device"
          description="Simulated online device"
        />
        <Marker
          coordinate={testLocation2}
          title="Nearby Device"
          description="Another simulated device"
        />
      </MapView>

      <View style={styles.separator} />

      <View style={styles.info}>
        {location ? (
          <Text style={styles.locationText}>
            Latitude: {location.latitude}, Longitude: {location.longitude}
          </Text>
        ) : (
          <Text style={styles.locationText}>Getting Location...</Text>
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
  container: {
    flex: 1,
  },
  map: {
    flex: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    width: '100%',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  locationText: {
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
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
});