import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEngine } from '../context/EngineContext';
import { APP_CREAM } from '../constants/theme';

const PRESET_IMAGES = [
  require('../../assets/profile pics/IMG_20260326_174414.jpg'),
  require('../../assets/profile pics/Screenshot_2026-03-24-22-57-10-08_1c337646f29875672b5a61192b9010f9.jpg'),
  require('../../assets/profile pics/Screenshot_2026-03-26-00-08-53-86_99c04817c0de5652397fc8b56c3b3817.jpg'),
  require('../../assets/profile pics/Screenshot_2026-03-26-10-46-44-00_1c337646f29875672b5a61192b9010f9.jpg'),
  require('../../assets/profile pics/Screenshot_2026-03-26-17-46-10-49_1c337646f29875672b5a61192b9010f9.jpg'),
  require('../../assets/profile pics/Screenshot_2026-03-26-21-55-20-67_1c337646f29875672b5a61192b9010f9.jpg'),
  require('../../assets/profile pics/Screenshot_2026-03-26-22-23-29-62_1c337646f29875672b5a61192b9010f9.jpg'),
  require('../../assets/profile pics/Screenshot_2026-03-27-01-44-15-59_1c337646f29875672b5a61192b9010f9.jpg'),
];

export default function Onboarding({ onComplete }) {
  const { setUserName, setAvatarUri, setAvatarPresetIndex, completeOnboarding } =
    useEngine();
  const [name, setName] = useState('');
  const [localAvatarUri, setLocalAvatarUri] = useState(null);
  const [localPresetIndex, setLocalPresetIndex] = useState(null);

  const avatarSource = localAvatarUri
    ? { uri: localAvatarUri }
    : localPresetIndex !== null
      ? PRESET_IMAGES[localPresetIndex]
      : null;

  const pickImageAsync = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to choose a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLocalAvatarUri(result.assets[0].uri);
      setLocalPresetIndex(null);
    }
  };

  const selectPreset = (index) => {
    setLocalPresetIndex(index);
    setLocalAvatarUri(null);
  };

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }

    setUserName(trimmed);
    if (localAvatarUri) {
      setAvatarUri(localAvatarUri);
    } else if (localPresetIndex !== null) {
      setAvatarPresetIndex(localPresetIndex);
    }
    await completeOnboarding();
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.pageContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Welcome to REGINA</Text>
          <Text style={styles.subtitle}>
            Tell us a little about yourself to personalize your cycle journey.
          </Text>

          <TouchableOpacity
            style={styles.avatarPlaceholder}
            onPress={pickImageAsync}
            activeOpacity={0.85}
          >
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="person" size={48} color="#A8B5A2" />
            )}
            <View style={styles.editBadge}>
              <MaterialIcons name="add-a-photo" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap the circle to choose from your gallery</Text>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickImageAsync}
            activeOpacity={0.85}
          >
            <MaterialIcons name="photo-library" size={24} color="#333333" />
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <Text style={styles.presetTitle}>Or pick a preset avatar:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetScroll}
          >
            {PRESET_IMAGES.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.presetThumbContainer,
                  localPresetIndex === idx && styles.presetThumbSelected,
                ]}
                onPress={() => selectPreset(idx)}
                activeOpacity={0.85}
              >
                <Image source={img} style={styles.presetThumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#888888"
            autoCapitalize="words"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_CREAM,
  },
  flex: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    fontFamily: 'Inter',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(168, 181, 162, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#A8B5A2',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#888888',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: APP_CREAM,
  },
  avatarHint: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  galleryButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Inter',
  },
  presetTitle: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  presetScroll: {
    paddingRight: 20,
    marginBottom: 28,
  },
  presetThumbContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetThumbSelected: {
    borderColor: '#E8B4B8',
  },
  presetThumb: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#333333',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    fontFamily: 'Inter',
  },
  continueButton: {
    backgroundColor: '#E8B4B8',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  continueButtonText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
