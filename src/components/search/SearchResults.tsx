import React from 'react';
import { View, Text, SectionList, StyleSheet, ActivityIndicator } from 'react-native';
import { SearchResults as SearchResultsType } from '@/services/searchService';
import { SearchResultItem } from './SearchResultItem';
import { Track, Playlist } from '@/types/audio';
import { colors } from '@/constants/colors';

interface SearchResultsProps {
  results: SearchResultsType;
  isSearching: boolean;
  query: string;
  onTrackPress: (track: Track) => void;
  onPlaylistPress: (playlist: Playlist) => void;
}

export function SearchResults({
  results,
  isSearching,
  query,
  onTrackPress,
  onPlaylistPress,
}: SearchResultsProps) {
  if (isSearching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  }

  if (query && results.totalCount === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noResultsText}>No results found</Text>
        <Text style={styles.noResultsSubtext}>
          Try different keywords
        </Text>
      </View>
    );
  }

  // Build sections
  const sections = [];
  
  if (results.tracks.length > 0) {
    sections.push({
      title: `Tracks (${results.tracks.length})`,
      data: results.tracks.map(track => ({ type: 'track' as const, item: track })),
    });
  }

  if (results.playlists.length > 0) {
    sections.push({
      title: `Playlists (${results.playlists.length})`,
      data: results.playlists.map(playlist => ({ type: 'playlist' as const, item: playlist })),
    });
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.type}-${item.item.id}`}
      renderItem={({ item }) => (
        <SearchResultItem
          type={item.type}
          item={item.item}
          onPress={() => {
            if (item.type === 'track') {
              onTrackPress(item.item as Track);
            } else {
              onPlaylistPress(item.item as Playlist);
            }
          }}
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 78, // Align with text
  },
  listContent: {
    flexGrow: 1,
  },
});
