import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BookingScreen from './src/screens/BookingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const checkToken = async () => {
      let token;
      try {
        token = await AsyncStorage.getItem('token');
      } catch (e) {
        // ignore
      }
      setUserToken(token);
      setIsLoading(false);
    };
    checkToken();
  }, []);

  const handleLoginSuccess = async () => {
    const token = await AsyncStorage.getItem('token');
    setUserToken(token);
  };

  const handleLogout = () => {
    setUserToken(null);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }}>
        {userToken == null ? (
          // ── Auth Stack ──
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
              initialParams={{ onLoginSuccess: handleLoginSuccess }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ title: 'إنشاء حساب جديد' }} 
            />
          </>
        ) : (
          // ── Main Stack ──
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ title: 'لوحة التحكم', headerShown: false }} 
              initialParams={{ onLogout: handleLogout }}
            />
            <Stack.Screen 
              name="Booking" 
              component={BookingScreen} 
              options={{ title: 'تأكيد الحجز' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
