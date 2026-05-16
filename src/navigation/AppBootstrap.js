import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEngine } from '../context/EngineContext';
import AnimatedSplash from '../components/AnimatedSplash';
import Onboarding from '../screens/Onboarding';
import AppNavigator from './AppNavigator';
import { SPLASH_PINK } from '../constants/theme';

/**
 * State machine:
 * loading → animatedSplash → onboarding | main
 */
export default function AppBootstrap({ fontsLoaded, cursiveFontFamily }) {
  const { isLoaded, hasCompletedOnboarding } = useEngine();
  const [phase, setPhase] = useState('loading');
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  useEffect(() => {
    if (!fontsLoaded || !isLoaded || nativeSplashHidden) {
      return;
    }

    SplashScreen.hideAsync()
      .then(() => {
        setNativeSplashHidden(true);
        setPhase('animatedSplash');
      })
      .catch((e) => {
        console.error('Failed to hide splash screen', e);
        setNativeSplashHidden(true);
        setPhase('animatedSplash');
      });
  }, [fontsLoaded, isLoaded, nativeSplashHidden]);

  const handleSplashComplete = useCallback(() => {
    setPhase(hasCompletedOnboarding ? 'main' : 'onboarding');
  }, [hasCompletedOnboarding]);

  const handleOnboardingComplete = useCallback(() => {
    setPhase('main');
  }, []);

  if (phase === 'loading') {
    return <View style={styles.loadingPlaceholder} />;
  }

  if (phase === 'animatedSplash') {
    return (
      <AnimatedSplash
        fontFamily={cursiveFontFamily}
        onComplete={handleSplashComplete}
      />
    );
  }

  if (phase === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loadingPlaceholder: {
    flex: 1,
    backgroundColor: SPLASH_PINK,
  },
});
