import React, { useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search tracks, artists, playlists...',
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure keyboard animation is smooth
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
      
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never" // We'll use custom clear button
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0, // Remove default padding
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});
