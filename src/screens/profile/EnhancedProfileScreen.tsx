import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { SettingItem } from '../../components/profile/SettingItem';

export default function EnhancedProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <ProfileHeader 
        displayName={user?.displayName} 
        email={user?.email} 
      />

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your name and email"
          onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
        />
        
        <SettingItem
          icon="key-outline"
          title="Change Password"
          subtitle="Update your password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <SettingItem
          icon="settings-outline"
          title="Settings"
          subtitle="App preferences and options"
          onPress={() => navigation.navigate('Settings')}
        />
        
        <SettingItem
          icon="heart-outline"
          title="Favorites"
          subtitle="View your liked songs"
          onPress={() => navigation.navigate('Favorites')}
        />
        
        <SettingItem
          icon="stats-chart-outline"
          title="Listening Stats"
          subtitle="Coming soon"
          onPress={() => Alert.alert('Coming Soon', 'Stats will be available soon')}
        />
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <SettingItem
          icon="information-circle-outline"
          title="About Demus"
          subtitle="Version 1.0.0"
          onPress={() => Alert.alert('Demus Music', 'Version 1.0.0\n\nA modern music streaming app.')}
          showChevron={false}
        />
        
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Get help with the app"
          onPress={() => Alert.alert('Help', 'Contact support@demus.app')}
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <SettingItem
          icon="log-out-outline"
          title="Logout"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          iconColor="#ef4444"
          showChevron={false}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Logged in as {user?.email}
        </Text>
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
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
