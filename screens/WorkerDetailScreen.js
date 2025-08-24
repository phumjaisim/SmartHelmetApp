import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { connectToMQTT, onMQTTMessage, disconnectMQTT, publishHelmetSOS } from '../mqttClient';

const { width } = Dimensions.get('window');

export default function WorkerDetailScreen({ route, navigation }) {
  const { worker } = route.params;
  const [mqttDataMap, setMqttDataMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
    });
    
    // Set loading to false after 3 seconds even if no data
    const timer = setTimeout(() => setIsLoading(false), 3000);
    
    return () => {
      disconnectMQTT();
      clearTimeout(timer);
    };
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

  const isConnected = !!currentData;
  const isHeartRateNormal = heartRate !== 'N/A' && heartRate >= 60 && heartRate <= 100;
  const heartRateStatus = heartRate === 'N/A' ? 'unknown' : isHeartRateNormal ? 'normal' : 'warning';

  const handlePing = () => {
    Alert.alert('📡 Pinging Helmet', `Sending ping to helmet ID ${worker.hatId}`);
  };

  const handleSOS = () => {
    if (worker.hatId) {
      publishHelmetSOS(worker.hatId);
      Alert.alert('🚨 SOS Alert', `Emergency signal sent to helmet ID ${worker.hatId}`);
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
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Hero Header */}
      <LinearGradient
        colors={['#1a237e', '#3949ab']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.workerInfo}>
            <Text style={styles.headerName}>{worker.name}</Text>
            <Text style={styles.headerRole}>{worker.role || 'Electrician'}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4caf50' : '#f44336' }]} />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>
          <Image source={imageSource} style={styles.headerAvatar} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Worker Details Card - Detailed */}
        <View style={styles.detailedCard}>
          <View style={styles.cardHeaderWithBpm}>
            <Text style={styles.detailedCardTitle}>Worker Information</Text>
            <View style={styles.bpmIndicator}>
              <FontAwesome 
                name="heartbeat" 
                size={18} 
                color={heartRateStatus === 'warning' ? '#ff9800' : heartRateStatus === 'normal' ? '#4caf50' : '#9e9e9e'} 
              />
              <Text style={styles.bpmText}>{heartRate}</Text>
            </View>
          </View>
          
          <View style={styles.detailedInfoGrid}>
            <View style={styles.detailedInfoRow}>
              <View style={styles.detailedInfoItem}>
                <Ionicons name="person" size={16} color="#666" />
                <View style={styles.detailedInfoContent}>
                  <Text style={styles.detailedInfoLabel}>Nationality</Text>
                  <Text style={styles.detailedInfoValue}>{worker.nationality || 'Unknown'}</Text>
                </View>
              </View>
              <View style={styles.detailedInfoItem}>
                <MaterialIcons name="bloodtype" size={16} color="#666" />
                <View style={styles.detailedInfoContent}>
                  <Text style={styles.detailedInfoLabel}>Blood Type</Text>
                  <Text style={styles.detailedInfoValue}>{worker.bloodType || 'N/A'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailedInfoRow}>
              <View style={styles.detailedInfoItem}>
                <Ionicons name="calendar" size={16} color="#666" />
                <View style={styles.detailedInfoContent}>
                  <Text style={styles.detailedInfoLabel}>Age</Text>
                  <Text style={styles.detailedInfoValue}>{worker.age || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.detailedInfoItem}>
                <Ionicons name={worker.gender === 'Male' ? 'male' : worker.gender === 'Female' ? 'female' : 'person'} size={16} color="#666" />
                <View style={styles.detailedInfoContent}>
                  <Text style={styles.detailedInfoLabel}>Gender</Text>
                  <Text style={styles.detailedInfoValue}>{worker.gender || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Location & Helmet Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Location & Helmet Status</Text>
            <View style={styles.helmetBadge}>
               <Text style={styles.helmetId}>Helmet ID: </Text>
              <Text style={styles.helmetId}>{worker.hatId || 'HT-3422'}</Text>
            </View>
          </View>
          
          <View style={styles.mapContainer}>
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
                <Marker 
                  coordinate={workerLocation} 
                  title={worker.name}
                  description={`Last seen: ${lastUpdated}`}
                >
                  <View style={styles.customMarker}>
                    <Image source={imageSource} style={styles.markerImage} />
                  </View>
                </Marker>
              )}
            </MapView>
            
            {!workerLocation && (
              <View style={styles.mapPlaceholder}>
                <MaterialIcons name="location-off" size={48} color="#ccc" />
                <Text style={styles.mapPlaceholderText}>Location not available</Text>
              </View>
            )}
          </View>
          
          <View style={styles.locationInfo}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
          </View>
        </View>

        {/* Action Buttons - Horizontal Row */}
        <View style={styles.horizontalButtonContainer}>
          <TouchableOpacity 
            style={[styles.horizontalButton]} 
            onPress={handlePing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2196f3', '#1976d2']}
              style={styles.horizontalButtonGradient}
            >
              <MaterialIcons name="wifi" size={20} color="white" />
              <Text style={styles.horizontalButtonText}>Ping Helmet</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.horizontalButton]} 
            onPress={handleSOS}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f44336', '#d32f2f']}
              style={styles.horizontalButtonGradient}
            >
              <MaterialIcons name="emergency" size={20} color="white" />
              <Text style={styles.horizontalButtonText}>Emergency SOS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Header Styles
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  workerInfo: {
    flex: 1,
    marginRight: 15,
  },
  headerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerRole: {
    fontSize: 16,
    color: '#e8eaf6',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  // Scroll Container
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Card Styles
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Info Grid
  infoGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Heart Rate Card
  heartRateCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  heartRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartRateInfo: {
    flex: 1,
    alignItems: 'center',
  },
  heartRateValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  heartRateUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: -4,
  },
  heartRateStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heartRateStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  // Helmet Badge
  helmetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  helmetId: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Detailed Card Styles
  detailedCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderWithBpm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailedCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bpmIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  bpmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  detailedInfoGrid: {
    gap: 16,
  },
  detailedInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailedInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedInfoContent: {
    marginLeft: 10,
    flex: 1,
  },
  detailedInfoLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  detailedInfoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Map Styles - Larger
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  mapPlaceholderText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'white',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  
  // Action Buttons
  actionContainer: {
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Horizontal Button Styles
  horizontalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
    gap: 12,
  },
  horizontalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  horizontalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  horizontalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
