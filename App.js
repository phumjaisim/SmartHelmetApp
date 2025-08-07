import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import WorkerListScreen from './screens/WorkerListScreen';
import WorkerDetailScreen from './screens/WorkerDetailScreen';

import { connectToMQTT, onSOSMessage } from './mqttClient';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Connect to MQTT and listen for SOS messages
    connectToMQTT();

    // Global SOS message alert
    onSOSMessage((hatid) => {
      Alert.alert('🚨 SOS Alert 🚨', `Helmet ID: ${hatid} has sent an SOS signal!`);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'ลงชื่อเข้าใช้', headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'สมัครสมาชิก' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'หน้าหลัก' }}
        />
        <Stack.Screen
          name="Workers"
          component={WorkerListScreen}
          options={{ title: 'รายชื่อพนักงาน' }}
        />
        <Stack.Screen
          name="WorkerDetails"
          component={WorkerDetailScreen}
          options={{ title: 'รายละเอียดพนักงาน' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
