import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type SectionHeaderProps = {
  title: string;
  onViewAll?: () => void;
};

/**
 * Reusable section header with optional "View All" action
 * Used for Recently Played and Recent Playlists sections
 */
export default function SectionHeader({ title, onViewAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 2,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: -2, // Optical alignment
  },
});
