import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEngine } from '../context/EngineContext';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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

export default function UserProfile() {
  const {
    averageCycle,
    periodLength,
    userHistory,
    setUserHistory,
    userName,
    setUserName,
    avatarUri,
    setAvatarUri,
    avatarPresetIndex,
    setAvatarPresetIndex,
  } = useEngine();
  const [isModalVisible, setModalVisible] = useState(false);

  // Resolve the current profile pic source for <Image>
  const profilePicSource = avatarUri
    ? { uri: avatarUri }
    : avatarPresetIndex !== null
    ? PRESET_IMAGES[avatarPresetIndex]
    : null;

  const loggedPeriods = userHistory.filter(e => e.type === 'period').length;

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri); // persisted
      setModalVisible(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Data",
      "are you sure you want to reset the apps data",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => setUserHistory([]) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <View style={styles.appBarIconPlaceholder} />
        <Text style={styles.appBarTitle}>PROFILE</Text>
        <View style={styles.appBarIconPlaceholder} />
      </View>

      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarPlaceholder} onPress={() => setModalVisible(true)}>
            {profilePicSource ? (
              <Image source={profilePicSource} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="person" size={48} color="#A8B5A2" />
            )}
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.nameInputContainer}>
            <TextInput
              style={styles.userNameInput}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor="#888888"
            />
            <MaterialIcons name="edit" size={18} color="#A8B5A2" style={styles.editIcon} />
          </View>
          <Text style={styles.userSubtitle}>Basic Pack</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Cycle Data</Text>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <View style={[styles.dot, { backgroundColor: '#B8CBD0' }]} />
              <Text style={styles.statLabel}>Average Cycle Length</Text>
            </View>
            <Text style={styles.statValue}>{averageCycle} Days</Text>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <View style={[styles.dot, { backgroundColor: '#E8B4B8' }]} />
              <Text style={styles.statLabel}>Average Period Duration</Text>
            </View>
            <Text style={styles.statValue}>{periodLength} Days</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <View style={[styles.dot, { backgroundColor: '#333333' }]} />
              <Text style={styles.statLabel}>Total Logged Periods</Text>
            </View>
            <Text style={styles.statValue}>{loggedPeriods}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset App Data</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Profile Picture Selection Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Profile Picture</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.galleryButton} onPress={pickImageAsync}>
              <MaterialIcons name="photo-library" size={24} color="#333333" />
              <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <Text style={styles.presetTitle}>Or pick a preset avatar:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              {PRESET_IMAGES.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetThumbContainer}
                  onPress={() => {
                    setAvatarPresetIndex(idx); // persisted
                    setModalVisible(false);
                  }}
                >
                  <Image source={img} style={styles.presetThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(253, 251, 247, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#333333',
    fontFamily: 'Inter',
  },
  appBarIconPlaceholder: {
    width: 32,
    height: 32,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(168, 181, 162, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#A8B5A2',
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userNameInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
    textAlign: 'center',
    padding: 0,
    marginLeft: 26,
  },
  editIcon: {
    marginLeft: 8,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Inter',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginVertical: 4,
  },
  resetButton: {
    marginTop: 40,
    backgroundColor: '#FFF2F2',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  resetButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
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
    borderColor: '#FDFBF7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  presetScroll: {
    paddingRight: 24,
  },
  presetThumbContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetThumb: {
    width: '100%',
    height: '100%',
  },
});
