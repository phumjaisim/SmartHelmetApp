import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import WorkerListScreen from './screens/WorkerListScreen';
import WorkerDetailScreen from './screens/WorkerDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Workers" component={WorkerListScreen} />
        <Stack.Screen name="WorkerDetails" component={WorkerDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
