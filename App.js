import React, { useEffect, useCallback, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import WorkerListScreen from './screens/WorkerListScreen';
import WorkerDetailScreen from './screens/WorkerDetailScreen';

import { connectToMQTT, onSOSMessage, disconnectMQTT } from './mqttClient';
import ErrorBoundary from './components/ErrorBoundary';

const Stack = createNativeStackNavigator();

const App = () => {
  const sosCleanupRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Optimized SOS alert handler
  const handleSOSAlert = useCallback((hatid) => {
    Alert.alert(
      '🚨 SOS Alert 🚨', 
      `Helmet ID: ${hatid} has sent an SOS signal!`,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
      {
        cancelable: true,
      }
    );
  }, []);

  useEffect(() => {
    // Initialize MQTT connection and SOS listener
    const initializeApp = async () => {
      try {
        await connectToMQTT();
        
        // Setup global SOS message listener
        sosCleanupRef.current = onSOSMessage(handleSOSAlert);
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();

    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        // Reconnect MQTT if needed
        connectToMQTT();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background');
        // Optionally disconnect MQTT to save resources
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      if (sosCleanupRef.current) {
        sosCleanupRef.current();
      }
      // Don't disconnect MQTT here as other screens might be using it
    };
  }, [handleSOSAlert]);

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login" 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 200,
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Workers"
            component={WorkerListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WorkerDetails"
            component={WorkerDetailScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default App;
