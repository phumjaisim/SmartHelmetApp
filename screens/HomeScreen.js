import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { connectToMQTT, onMQTTMessage, publishSOS, getMQTTStatus } from '../mqttClient';
import { calculateDistance, safeJsonParse } from '../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const HomeScreen = React.memo(({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [mqttDataMap, setMqttDataMap] = useState({});
  const [selectedHat, setSelectedHat] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [mqttStatus, setMqttStatus] = useState({ connected: false, connecting: false });
  const [totalWorkers, setTotalWorkers] = useState(0);
  
  const mapRef = useRef(null);
  const mqttUnsubscribeRef = useRef(null);

  // Optimized location permission and fetching using Expo Location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Request foreground permissions first
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          Alert.alert(
            'Location Permission Required',
            'This app needs location permission to track helmet positions.'
          );
          setIsLoadingLocation(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000,
          maximumAge: 10000,
        });
        
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        
        console.log('Location obtained:', currentLocation.coords);
        setIsLoadingLocation(false);
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert(
          'Location Error',
          'Unable to get your location. Please check your location settings.'
        );
        setIsLoadingLocation(false);
      }
    };

    requestLocationPermission();
  }, []);

  // Optimized MQTT connection and message handling
  useEffect(() => {
    const initializeMQTT = async () => {
      try {
        await connectToMQTT();
        setMqttStatus(getMQTTStatus());
        
        // Subscribe to MQTT messages with cleanup function
        mqttUnsubscribeRef.current = onMQTTMessage((message) => {
          setMqttDataMap(prev => ({
            ...prev,
            [message.hatId]: {
              ...message,
              timestamp: Date.now() // Add timestamp for real-time updates
            }
          }));
        });
      } catch (error) {
        console.error('MQTT initialization error:', error);
        Alert.alert('การเชื่อมต่อล้มเหลว', 'ไม่สามารถเชื่อมต่อ MQTT ได้');
      }
    };

    initializeMQTT();

    // Periodic status check
    const statusInterval = setInterval(() => {
      setMqttStatus(getMQTTStatus());
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      if (mqttUnsubscribeRef.current) {
        mqttUnsubscribeRef.current();
      }
    };
  }, []);

  // Load total workers count from AsyncStorage
  useEffect(() => {
    const loadTotalWorkers = async () => {
      try {
        const stored = await AsyncStorage.getItem('workers');
        if (stored) {
          const parsedWorkers = safeJsonParse(stored, []);
          setTotalWorkers(parsedWorkers.length);
        }
      } catch (error) {
        console.error('Load total workers error:', error);
      }
    };

    loadTotalWorkers();
  }, []);

  // Optimized distance calculation using utility function
  const getDistance = useCallback((target) => {
    return calculateDistance(location, target);
  }, [location]);

  // Memoized navigation handler
  const handleNavigate = useCallback((target) => {
    if (target?.latitude && target?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`;
      Linking.openURL(url).catch(err => {
        console.error('Navigation error:', err);
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดแอปแผนที่ได้');
      });
    }
  }, []);

  // Optimized SOS handler
  const handleSOS = useCallback(() => {
    try {
      publishSOS(); // Sends 'sos' as default message for global SOS
      Alert.alert('🚨 Global SOS', 'All Helmets sending SOS Signal');
    } catch (error) {
      console.error('SOS send error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งสัญญาณ SOS ได้');
    }
  }, []);

  // Memoized calculations
  const hatIds = useMemo(() => Object.keys(mqttDataMap), [mqttDataMap]);
  
  const initialRegion = useMemo(() => ({
    latitude: location?.latitude || 13.736717,
    longitude: location?.longitude || 100.523186,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [location]);

  const selectedHatData = useMemo(() => 
    selectedHat ? mqttDataMap[selectedHat] : null, 
    [selectedHat, mqttDataMap]
  );

  // Analytics data calculations
  const analytics = useMemo(() => {
    // Use totalWorkers from AsyncStorage for accurate count
    const total = totalWorkers;
    let online = 0;
    let sos = 0;
    let averageHeartRate = 0;
    let heartRateSum = 0;
    let heartRateCount = 0;

    // Only count MQTT data for online status
    hatIds.forEach(hatId => {
      const data = mqttDataMap[hatId];
      if (data) {
        online++;
        if (data.helmetStatus === 'SOS' || data.helmetStatus === 'EMERGENCY') {
          sos++;
        }
        if (data.heartRate && data.heartRate !== 'N/A' && data.heartRate > 0) {
          heartRateSum += parseInt(data.heartRate);
          heartRateCount++;
        }
      }
    });

    if (heartRateCount > 0) {
      averageHeartRate = Math.round(heartRateSum / heartRateCount);
    }

    return {
      total,
      online,
      offline: total - online,
      sos,
      averageHeartRate: heartRateCount > 0 ? averageHeartRate : 'N/A'
    };
  }, [totalWorkers, hatIds, mqttDataMap]);

  // Get marker color based on helmet status
  const getMarkerColor = useCallback((data, hatId) => {
    if (selectedHat === hatId) return '#2196f3'; // Blue for selected
    if (data.helmetStatus === 'SOS' || data.helmetStatus === 'EMERGENCY') return '#ff1744'; // Red for SOS
    return '#4caf50'; // Green for normal
  }, [selectedHat]);

  if (isLoadingLocation) {
    return (
      <View style={styles.modernContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
        <LinearGradient
          colors={['#1a237e', '#3949ab']}
          style={styles.loadingHeader}
        >
          <MaterialIcons name="location-searching" size={32} color="white" />
          <Text style={styles.loadingHeaderText}>Smart Helmet Monitor</Text>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.modernLoadingText}>Getting your location...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Modern Header with Live Stats */}
      <LinearGradient
        colors={['#1a237e', '#3949ab']}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="dashboard" size={32} color="white" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>TUPP Construction Site</Text>
              <View style={styles.connectionStatusContainer}>
                <View style={[
                  styles.connectionDot, 
                  { backgroundColor: mqttStatus.connected ? '#4caf50' : '#ff5722' }
                ]} />
                <Text style={styles.connectionText}>
                  {mqttStatus.connected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              try {
                // Force refresh MQTT connection and data
                await connectToMQTT();
                setMqttStatus(getMQTTStatus());
                
                // Clear current data to force refresh
                setMqttDataMap({});
                
                // Re-center map to current location
                if (mapRef.current && location) {
                  mapRef.current.animateToRegion(initialRegion, 1000);
                }
                
                console.log('🔄 Live tracking refreshed');
              } catch (error) {
                console.error('Refresh error:', error);
                Alert.alert('Refresh Error', 'Failed to refresh live tracking');
              }
            }}
          >
            <MaterialIcons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Analytics Cards - Only Total and Online */}
      <View style={styles.analyticsRow}>
        <View style={styles.analyticsCard}>
          <LinearGradient
            colors={['#4caf50', '#2e7d32']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="people" size={24} color="white" />
            <Text style={styles.cardValue}>{analytics.total}</Text>
            <Text style={styles.cardLabel}>Total Workers</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.analyticsCard}>
          <LinearGradient
            colors={['#2196f3', '#1565c0']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="wifi" size={24} color="white" />
            <Text style={styles.cardValue}>{analytics.online}</Text>
            <Text style={styles.cardLabel}>Online</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Full Screen Map Section */}
      <View style={styles.fullMapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Live Tracking</Text>
          {selectedHat && (
            <TouchableOpacity
              style={styles.clearSelectionButton}
              onPress={() => setSelectedHat(null)}
            >
              <Text style={styles.clearSelectionText}>Clear Selection</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.modernMap}
          showsUserLocation={true}
          showsMyLocationButton={true}
          initialRegion={initialRegion}
          mapType="standard"
          loadingEnabled={false}
          moveOnMarkerPress={false}
          showsBuildings={true}
          showsCompass={true}
          showsScale={false}
          showsTraffic={false}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          maxZoomLevel={18}
          minZoomLevel={5}
        >
          {hatIds.map((hatId) => {
            const data = mqttDataMap[hatId];
            if (!data?.latitude || !data?.longitude) return null;
            
            const isSelected = selectedHat === hatId;
            const isEmergency = data.helmetStatus === 'SOS' || data.helmetStatus === 'EMERGENCY';
            
            return (
              <Marker
                key={hatId}
                coordinate={{
                  latitude: parseFloat(data.latitude),
                  longitude: parseFloat(data.longitude),
                }}
                title={`Helmet ${hatId}`}
                description={`${isEmergency ? '🚨 EMERGENCY | ' : ''}${isSelected && location ? `Distance: ${getDistance(data)}km` : 'Tap for details'}`}
                pinColor={getMarkerColor(data, hatId)}
                onPress={() => setSelectedHat(hatId)}
              >
                {isEmergency && (
                  <View style={styles.emergencyMarker}>
                    <MaterialIcons name="warning" size={20} color="white" />
                  </View>
                )}
              </Marker>
            );
          })}
        </MapView>

        {/* Selected Worker Info */}
        {selectedHat && selectedHatData && (
          <View style={styles.selectedWorkerInfo}>
            <View style={styles.workerInfoCard}>
              <View style={styles.workerInfoLeft}>
                <Text style={styles.selectedWorkerTitle}>Helmet {selectedHat}</Text>
                <Text style={styles.selectedWorkerDetails}>
                  Status: {selectedHatData.helmetStatus || 'Normal'} | 
                  Heart Rate: {selectedHatData.heartRate || 'N/A'} BPM
                  {location && ` | Distance: ${getDistance(selectedHatData)}km`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.navigateIconButton}
                onPress={() => handleNavigate(selectedHatData)}
              >
                <MaterialIcons name="navigation" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.modernViewButton}
          onPress={() => navigation.navigate('Workers')}
        >
          <LinearGradient
            colors={['#4caf50', '#2e7d32']}
            style={styles.actionButtonGradient}
          >
            <MaterialIcons name="list" size={20} color="white" />
            <Text style={styles.actionButtonText}>View All Workers</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.modernSosButton} 
          onPress={handleSOS}
        >
          <LinearGradient
            colors={['#ff1744', '#d50000']}
            style={styles.actionButtonGradient}
          >
            <MaterialIcons name="warning" size={20} color="white" />
            <Text style={styles.sosActionText}>Emergency SOS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  // Modern Container
  modernContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  // Loading Styles
  loadingHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
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
  connectionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#e8eaf6',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Analytics Cards
  analyticsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  analyticsCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },

  // Full Map Section
  fullMapContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  // Map Section (legacy - keep for compatibility)
  mapContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearSelectionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearSelectionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modernMap: {
    flex: 1,
    minHeight: 200,
  },

  // Emergency Marker
  emergencyMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff1744',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },

  // Selected Worker Info
  selectedWorkerInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  workerInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  workerInfoLeft: {
    flex: 1,
  },
  selectedWorkerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedWorkerDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navigateIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modernViewButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernSosButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sosActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
