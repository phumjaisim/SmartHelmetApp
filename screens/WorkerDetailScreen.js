import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Linking,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { connectToMQTT, onMQTTMessage, disconnectMQTT, publishSOS } from '../mqttClient';
import { Button, Card, StatusBadge } from '../components/UIComponents';
import { theme } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

export default function WorkerDetailScreen({ route, navigation }) {
  const { worker } = route.params;
  const [mqttDataMap, setMqttDataMap] = useState({});
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    connectToMQTT();
    onMQTTMessage((data) => {
      if (data.hatId === worker.hatId) {
        setMqttDataMap((prev) => ({
          ...prev,
          [data.hatId]: {
            ...data,
            timestamp: new Date().toISOString(),
          },
        }));
      }
    });
    return () => disconnectMQTT();
  }, [worker.hatId]);

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
    : 'ไม่มีข้อมูลล่าสุด';

  const handlePing = () => {
    Alert.alert(
      '📡 กำลังส่งสัญญาณ', 
      `กำลังส่งสัญญาณไปยังหมวก ${worker.hatId}`,
      [{ text: 'ตกลง', style: 'default' }]
    );
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 ส่งสัญญาณฉุกเฉิน',
      `คุณแน่ใจหรือไม่ว่าต้องการส่งสัญญาณฉุกเฉินไปยังหมวก ${worker.hatId}?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ส่งสัญญาณ', 
          style: 'destructive',
          onPress: () => {
            if (worker.hatId) {
              publishSOS(worker.hatId);
              Alert.alert('✅ ส่งสำเร็จ', `ส่งสัญญาณฉุกเฉินไปยังหมวก ${worker.hatId} แล้ว`);
            } else {
              Alert.alert('⚠️ ผิดพลาด', 'ไม่พบรหัสหมวก');
            }
          }
        }
      ]
    );
  };

  const handleNavigate = () => {
    if (workerLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${workerLocation.latitude},${workerLocation.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('⚠️ ไม่มีข้อมูลตำแหน่ง', 'ไม่สามารถนำทางได้เนื่องจากไม่มีข้อมูลตำแหน่งล่าสุด');
    }
  };

  const imageSource = worker.image?.startsWith('data:image')
    ? { uri: worker.image }
    : worker.image
      ? { uri: worker.image }
      : { uri: 'https://via.placeholder.com/150' };

  const helmetStatus = currentData?.helmetStatus;
  const statusText = helmetStatus === '1' || helmetStatus === 1 
    ? 'ฉุกเฉิน' 
    : helmetStatus === '0' || helmetStatus === 0
      ? 'ปกติ'
      : 'ออฟไลน์';
  
  const statusType = helmetStatus === '1' || helmetStatus === 1
    ? 'danger'
    : helmetStatus === '0' || helmetStatus === 0
      ? 'normal'
      : 'offline';

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={theme.colors.text.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{worker.name}</Text>
            <Text style={styles.headerSubtitle}>{worker.role || 'พนักงาน'}</Text>
          </View>
          <StatusBadge 
            status={statusType}
            text={statusText}
            size="large"
          />
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Worker Profile Section */}
        <Animatable.View animation="fadeInUp" duration={800} delay={100}>
          <Card style={styles.profileCard}>
            <View style={styles.profileContent}>
              <Image source={imageSource} style={styles.avatar} />
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>ชื่อ:</Text>
                  <Text style={styles.infoValue}>{worker.name}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>ตำแหน่ง:</Text>
                  <Text style={styles.infoValue}>{worker.role || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="water" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>กรุ๊ปเลือด:</Text>
                  <Text style={styles.infoValue}>{worker.bloodType || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="flag" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>สัญชาติ:</Text>
                  <Text style={styles.infoValue}>{worker.nationality || '-'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>อายุ:</Text>
                  <Text style={styles.infoValue}>{worker.age || '-'} ปี</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name={worker.gender === 'male' ? 'male' : 'female'} size={20} color={theme.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>เพศ:</Text>
                  <Text style={styles.infoValue}>{worker.gender || '-'}</Text>
                </View>
              </View>
            </View>
          </Card>
        </Animatable.View>
        
        {/* Health Data Section */}
        <Animatable.View animation="fadeInUp" duration={800} delay={200}>
          <Card style={styles.healthCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={24} color={theme.colors.status.danger} />
              <Text style={styles.cardTitle}>ข้อมูลสุขภาพ</Text>
            </View>
            
            <View style={styles.healthDataContainer}>
              <View style={styles.healthData}>
                <Text style={styles.healthValue}>{heartRate}</Text>
                <Text style={styles.healthLabel}>อัตราการเต้นของหัวใจ</Text>
              </View>
              
              <FontAwesome name="heartbeat" size={48} color={theme.colors.status.danger} style={styles.heartIcon} />
            </View>
            
            <Text style={styles.updateTime}>อัพเดทล่าสุด: {lastUpdated}</Text>
          </Card>
        </Animatable.View>
        
        {/* Location Section */}
        <Animatable.View animation="fadeInUp" duration={800} delay={300}>
          <Card style={styles.mapCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={24} color={theme.colors.secondary} />
              <Text style={styles.cardTitle}>ตำแหน่งปัจจุบัน</Text>
              <TouchableOpacity 
                style={styles.recenterButton}
                onPress={() => {
                  if (mapRef.current && workerLocation) {
                    mapRef.current.animateToRegion({
                      ...workerLocation,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    });
                  }
                }}
              >
                <Ionicons name="locate" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                onMapReady={() => setMapReady(true)}
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
                    description={`หมวก: ${worker.hatId}`}
                  >
                    <View style={[
                      styles.customMarker,
                      { 
                        backgroundColor: statusType === 'danger' 
                          ? theme.colors.status.danger 
                          : statusType === 'normal' 
                            ? theme.colors.status.success 
                            : theme.colors.status.offline 
                      }
                    ]}>
                      <Ionicons 
                        name={statusType === 'danger' ? "warning" : "person"} 
                        size={20} 
                        color={theme.colors.text.white} 
                      />
                    </View>
                  </Marker>
                )}
              </MapView>
              
              <View style={styles.hatIdBadge}>
                <Text style={styles.hatIdText}>หมวก ID: {worker.hatId}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={handleNavigate}
              disabled={!workerLocation}
            >
              <Ionicons name="navigate" size={20} color={theme.colors.text.white} />
              <Text style={styles.navigateText}>นำทางไปยังตำแหน่งปัจจุบัน</Text>
            </TouchableOpacity>
          </Card>
        </Animatable.View>
      </ScrollView>
      
      {/* Action Buttons */}
      <Animatable.View animation="fadeInUp" duration={800} delay={400} style={styles.actionContainer}>
        <View style={styles.actionButtons}>
          <Button
            title="ส่งสัญญาณเตือน"
            variant="secondary"
            icon="notifications"
            style={{ flex: 1, marginRight: theme.spacing.md }}
            onPress={handlePing}
          />
          <Button
            title="ส่งสัญญาณ SOS"
            variant="danger"
            icon="warning"
            style={{ flex: 1 }}
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
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.white,
    opacity: 0.9,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  profileCard: {
    marginBottom: theme.spacing.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.xxl,
    marginRight: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoIcon: {
    marginRight: theme.spacing.xs,
    width: 24,
  },
  infoLabel: {
    ...theme.typography.body2,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    width: 70,
  },
  infoValue: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    flex: 1,
  },
  healthCard: {
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  healthDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  healthData: {
    flex: 1,
  },
  healthValue: {
    ...theme.typography.h1,
    color: theme.colors.status.danger,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  healthLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  heartIcon: {
    marginLeft: theme.spacing.lg,
  },
  updateTime: {
    ...theme.typography.caption,
    color: theme.colors.text.light,
    textAlign: 'right',
  },
  mapCard: {
    marginBottom: theme.spacing.md,
  },
  recenterButton: {
    padding: theme.spacing.xs,
  },
  mapContainer: {
    height: 250,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  hatIdBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
  },
  hatIdText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  navigateText: {
    ...theme.typography.body1,
    color: theme.colors.text.white,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  actionContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.text.light,
    ...theme.shadows.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
