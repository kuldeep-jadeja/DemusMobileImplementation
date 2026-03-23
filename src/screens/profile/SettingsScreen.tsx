import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingItem } from '../../components/profile/SettingItem';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }: any) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [downloadOverWiFi, setDownloadOverWiFi] = useState(true);
  const [highQualityAudio, setHighQualityAudio] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary data. Your favorites and playlists will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear specific cache items (not auth or favorites)
              await AsyncStorage.removeItem('@demus:searchCache');
              await AsyncStorage.removeItem('@demus:recentSearches');
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Theme',
      'Choose your preferred theme',
      [
        { text: 'Light', onPress: () => Alert.alert('Coming Soon') },
        { text: 'Dark', onPress: () => Alert.alert('Already using Dark theme') },
        { text: 'Auto', onPress: () => Alert.alert('Coming Soon') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleAudioQualityChange = () => {
    Alert.alert(
      'Audio Quality',
      'Choose your preferred audio quality',
      [
        { text: 'Low (96kbps)', onPress: () => {} },
        { text: 'Normal (128kbps)', onPress: () => {} },
        { text: 'High (256kbps)', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <SettingItem
          icon="color-palette-outline"
          title="Theme"
          subtitle="Dark"
          value="Dark"
          onPress={handleThemeChange}
        />
      </View>

      {/* Playback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Playback</Text>
        
        <SettingItem
          icon="musical-note-outline"
          title="Audio Quality"
          subtitle="Streaming quality"
          value="Normal"
          onPress={handleAudioQualityChange}
        />
        
        <View style={styles.settingWithSwitch}>
          <View style={styles.settingContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="download-outline" size={24} color="#1DB954" />
            </View>
            <View style={styles.textContent}>
              <Text style={styles.title}>Download over WiFi only</Text>
              <Text style={styles.subtitle}>Save mobile data</Text>
            </View>
          </View>
          <Switch
            value={downloadOverWiFi}
            onValueChange={setDownloadOverWiFi}
            trackColor={{ false: '#3e3e3e', true: '#1DB954' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingWithSwitch}>
          <View style={styles.settingContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-outline" size={24} color="#1DB954" />
            </View>
            <View style={styles.textContent}>
              <Text style={styles.title}>Push Notifications</Text>
              <Text style={styles.subtitle}>Get updates about new releases</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#3e3e3e', true: '#1DB954' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        
        <SettingItem
          icon="trash-outline"
          title="Clear Cache"
          subtitle="Free up storage space"
          onPress={handleClearCache}
          iconColor="#ef4444"
          showChevron={false}
        />
        
        <SettingItem
          icon="cloud-download-outline"
          title="Downloaded Music"
          subtitle="Coming soon"
          value="0 MB"
          showChevron={false}
        />
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content here')}
        />
        
        <SettingItem
          icon="document-text-outline"
          title="Terms of Service"
          onPress={() => Alert.alert('Terms', 'Terms of service content here')}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Demus Music v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  settingWithSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
