import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.label}>Name: {user?.displayName}</Text>
      <Text style={styles.label}>Email: {user?.email}</Text>
      
      <Button
        title="Change Password"
        onPress={() => navigation.navigate('ChangePassword')}
        variant="outline"
        style={styles.button}
      />
      
      <Button
        title="Logout"
        onPress={logout}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 16, marginBottom: 12 },
  button: { marginTop: 16 },
});
