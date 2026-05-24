import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0a0e1a',
    card: '#111827',
    text: '#e8edf5',
    border: '#2a3448',
    primary: '#e8303d',
  },
};

export default function App() {
  const { token, init } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    init().finally(() => setInitializing(false));
  }, []);

  if (initializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e8303d" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar style="light" backgroundColor="#0a0e1a" />
        {token ? <AppNavigator /> : <LoginScreen standalone />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});