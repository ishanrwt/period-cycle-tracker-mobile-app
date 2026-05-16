import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Checks for EAS Update bundles and prompts the user when one is available.
 * No UI rendered — only the native alert.
 */
export default function OtaUpdatePrompt() {
  const { isUpdateAvailable } = Updates.useUpdates();
  const alertShownRef = useRef(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }
    Updates.checkForUpdateAsync().catch((e) => {
      console.warn('OTA checkForUpdateAsync failed', e);
    });
  }, []);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled || !isUpdateAvailable || alertShownRef.current) {
      return;
    }

    alertShownRef.current = true;

    Alert.alert(
      '✨ AURA Update Available',
      'A new version is ready with bug fixes and improvements. Refresh the app to apply it now?',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Refresh App',
          onPress: () => {
            applyOtaUpdate(alertShownRef);
          },
        },
      ],
      { cancelable: true }
    );
  }, [isUpdateAvailable]);

  return null;
}

async function applyOtaUpdate(alertShownRef) {
  try {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (e) {
    console.error('OTA update failed', e);
    alertShownRef.current = false;
    Alert.alert(
      'Update failed',
      'Could not download or apply the update. Please try again later.'
    );
  }
}
