import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DancingScript_400Regular,
} from '@expo-google-fonts/dancing-script';
import { EngineProvider } from './src/context/EngineContext';
import AppBootstrap from './src/navigation/AppBootstrap';
import OtaUpdatePrompt from './src/components/OtaUpdatePrompt';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
  });

  return (
    <SafeAreaProvider>
      <OtaUpdatePrompt />
      <EngineProvider>
        <AppBootstrap
          fontsLoaded={fontsLoaded}
          cursiveFontFamily="DancingScript_400Regular"
        />
      </EngineProvider>
    </SafeAreaProvider>
  );
}
