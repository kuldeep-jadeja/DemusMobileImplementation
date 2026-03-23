import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface RecentSearchesProps {
  searches: string[];
  onSelectSearch: (query: string) => void;
  onClearAll: () => void;
}

export function RecentSearches({ searches, onSelectSearch, onClearAll }: RecentSearchesProps) {
  if (searches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No recent searches</Text>
        <Text style={styles.emptySubtext}>Your search history will appear here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Recent Searches</Text>
        <TouchableOpacity onPress={onClearAll}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={searches}
        keyExtractor={(item, index) => `search-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.searchItem}
            onPress={() => onSelectSearch(item)}
          >
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.searchText}>{item}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48, // Align with text, not icon
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
