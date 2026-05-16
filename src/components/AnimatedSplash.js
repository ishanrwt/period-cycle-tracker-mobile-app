import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SPLASH_PINK } from '../constants/theme';

const FADE_MS = 1000;
const HOLD_MS = 1500;

export default function AnimatedSplash({ fontFamily, onComplete }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setTimeout(() => {
          onComplete();
        }, HOLD_MS);
      }
    });

    return () => {
      animation.stop();
    };
  }, [opacity, onComplete]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.welcomeText,
          { opacity, fontFamily: fontFamily || undefined },
        ]}
      >
        Welcome
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 52,
    color: '#FFF9F5',
    letterSpacing: 1,
  },
});
