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
  ScrollView,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker } from 'react-native-maps';
import haversine from 'haversine-distance';
import { connectToMQTT, onMQTTMessage, disconnectMQTT } from '../mqttClient';
import { Button, Card, StatusBadge, Header } from '../components/UIComponents';
import { theme } from '../theme';
import * as Animatable from 'react-native-animatable';
import mqtt from 'mqtt';

const MQTT_BROKER = 'ws://ionlypfw.thddns.net:2025';
const TOPIC_SOS = 'soschannel';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [mqttDataMap, setMqttDataMap] = useState({});
  const [selectedHat, setSelectedHat] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
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
    Alert.alert(
      '🚨 ส่งสัญญาณฉุกเฉิน',
      'คุณแน่ใจหรือไม่ว่าต้องการส่งสัญญาณฉุกเฉินไปยังหมวกทุกใบ?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ส่งสัญญาณ', 
          style: 'destructive',
          onPress: () => {
            if (clientRef.current) {
              clientRef.current.publish(TOPIC_SOS, 'sos');
              Alert.alert('✅ ส่งสำเร็จ', 'ส่งสัญญาณฉุกเฉินไปยังหมวกทุกใบแล้ว');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const hatIds = Object.keys(mqttDataMap);
  const onlineWorkers = hatIds.filter(id => mqttDataMap[id]?.helmetStatus !== undefined);
  const sosWorkers = hatIds.filter(id => mqttDataMap[id]?.helmetStatus === '1' || mqttDataMap[id]?.helmetStatus === 1);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Smart Helmet</Text>
            <Text style={styles.headerSubtitle}>ระบบตรวจสอบความปลอดภัย</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.openDrawer?.() || null}
          >
            <Ionicons name="person-circle" size={40} color={theme.colors.text.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <Animatable.View animation="fadeInUp" duration={800} style={styles.statsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
        >
          <Card style={[styles.statCard, { backgroundColor: theme.colors.status.info }]}>
            <View style={styles.statContent}>
              <Ionicons name="people" size={32} color={theme.colors.text.white} />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{hatIds.length}</Text>
                <Text style={styles.statLabel}>พนักงานทั้งหมด</Text>
              </View>
            </View>
          </Card>
          
          <Card style={[styles.statCard, { backgroundColor: theme.colors.status.success }]}>
            <View style={styles.statContent}>
              <Ionicons name="shield-checkmark" size={32} color={theme.colors.text.white} />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{onlineWorkers.length}</Text>
                <Text style={styles.statLabel}>ออนไลน์</Text>
              </View>
            </View>
          </Card>
          
          <Card style={[styles.statCard, { backgroundColor: theme.colors.status.danger }]}>
            <View style={styles.statContent}>
              <Ionicons name="warning" size={32} color={theme.colors.text.white} />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{sosWorkers.length}</Text>
                <Text style={styles.statLabel}>สัญญาณฉุกเฉิน</Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </Animatable.View>

      {/* Map Container */}
      <Animatable.View animation="fadeInUp" delay={200} duration={800} style={styles.mapContainer}>
        <Card style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>ตำแหน่งพนักงาน</Text>
            <TouchableOpacity onPress={() => mapRef.current?.animateToRegion({
              latitude: location?.latitude || 13.736717,
              longitude: location?.longitude || 100.523186,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            })}>
              <Ionicons name="locate" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true}
            onMapReady={() => setIsMapReady(true)}
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
              const isSelected = selectedHat === hatId;
              const isSOS = data.helmetStatus === '1' || data.helmetStatus === 1;
              
              return (
                <Marker
                  key={hatId}
                  coordinate={{
                    latitude: parseFloat(data.latitude),
                    longitude: parseFloat(data.longitude),
                  }}
                  title={`หมวก ${hatId}`}
                  description={`สถานะ: ${isSOS ? 'ฉุกเฉิน!' : 'ปกติ'}`}
                  pinColor={isSOS ? '#DC3545' : isSelected ? '#2E86AB' : '#28A745'}
                  onPress={() => setSelectedHat(hatId)}
                >
                  <View style={[
                    styles.customMarker,
                    { 
                      backgroundColor: isSOS ? theme.colors.status.danger : 
                                     isSelected ? theme.colors.secondary : theme.colors.status.success 
                    }
                  ]}>
                    <Ionicons 
                      name={isSOS ? "warning" : "person"} 
                      size={20} 
                      color={theme.colors.text.white} 
                    />
                  </View>
                </Marker>
              );
            })}
          </MapView>
          
          {/* Selected Worker Info */}
          {selectedHat && mqttDataMap[selectedHat] && (
            <Animatable.View animation="slideInUp" style={styles.selectedWorkerInfo}>
              <View style={styles.workerInfoContent}>
                <Text style={styles.workerInfoTitle}>หมวก {selectedHat}</Text>
                <Text style={styles.workerInfoDistance}>
                  ระยะห่าง: {getDistance(mqttDataMap[selectedHat])} กม.
                </Text>
                <StatusBadge 
                  status={mqttDataMap[selectedHat].helmetStatus === '1' ? 'danger' : 'normal'}
                  text={mqttDataMap[selectedHat].helmetStatus === '1' ? 'ฉุกเฉิน' : 'ปกติ'}
                />
              </View>
              <Button
                title="นำทาง"
                size="small"
                icon="navigate"
                onPress={() => handleNavigate(mqttDataMap[selectedHat])}
              />
            </Animatable.View>
          )}
        </Card>
      </Animatable.View>

      {/* Action Buttons */}
      <Animatable.View animation="fadeInUp" delay={400} duration={800} style={styles.actionContainer}>
        <View style={styles.actionButtons}>
          <Button
            title="รายชื่อพนักงาน"
            variant="secondary"
            icon="people"
            style={{ flex: 1, marginRight: theme.spacing.sm }}
            onPress={() => navigation.navigate('Workers')}
          />
          <Button
            title="SOS"
            variant="danger"
            icon="warning"
            style={{ flex: 1, marginLeft: theme.spacing.sm }}
            onPress={handleSOS}
          />
        </View>
      </Animatable.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.white,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.white,
    opacity: 0.9
  },
  profileButton: {
    padding: theme.spacing.xs
  },
  statsContainer: {
    marginVertical: theme.spacing.md
  },
  statsScrollContent: {
    paddingHorizontal: theme.spacing.lg
  },
  statCard: {
    marginRight: theme.spacing.md,
    minWidth: 140,
    borderRadius: theme.borderRadius.xl
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statText: {
    marginLeft: theme.spacing.md,
    flex: 1
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.text.white,
    fontWeight: 'bold'
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.white,
    opacity: 0.9,
    marginTop: 2
  },
  mapContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg
  },
  mapCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden'
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text.light
  },
  mapTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary
  },
  map: {
    flex: 1,
    minHeight: 300
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface
  },
  selectedWorkerInfo: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.medium
  },
  workerInfoContent: {
    flex: 1,
    marginRight: theme.spacing.md
  },
  workerInfoTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4
  },
  workerInfoDistance: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.md
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});
