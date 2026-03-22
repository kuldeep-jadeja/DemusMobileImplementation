import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLibrary } from '../../contexts/LibraryContext';

type ImportPlaylistButtonProps = {
  onImportSuccess?: (playlistId: string) => void;
};

export function ImportPlaylistButton({ onImportSuccess }: ImportPlaylistButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { importPlaylist } = useLibrary();

  const handleOpenModal = () => {
    setIsModalVisible(true);
    setUrl('');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setUrl('');
  };

  const validateSpotifyUrl = (url: string): boolean => {
    const spotifyUrlPattern = /^(https?:\/\/)?(open\.spotify\.com\/playlist\/[\w-]+|spotify:playlist:[\w-]+)/;
    return spotifyUrlPattern.test(url.trim());
  };

  const handleImport = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      Alert.alert('Error', 'Please enter a Spotify playlist URL');
      return;
    }

    if (!validateSpotifyUrl(trimmedUrl)) {
      Alert.alert(
        'Invalid URL',
        'Please enter a valid Spotify playlist URL.\n\nExamples:\n• https://open.spotify.com/playlist/...\n• spotify:playlist:...'
      );
      return;
    }

    try {
      setIsImporting(true);
      const playlist = await importPlaylist(trimmedUrl);
      
      handleCloseModal();
      
      Alert.alert(
        'Success!',
        `"${playlist.name}" has been imported. ${playlist.status === 'matching' ? 'Tracks are being matched...' : 'Ready to play!'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onImportSuccess) {
                onImportSuccess(playlist.id);
              }
            },
          },
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import playlist';
      Alert.alert('Import Failed', errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={handleOpenModal}>
        <Ionicons name="add-circle" size={24} color="#1DB954" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Spotify Playlist</Text>
              <TouchableOpacity onPress={handleCloseModal} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <Text style={styles.instructions}>
              Paste a Spotify playlist link to import it to your library.
            </Text>

            {/* Input */}
            <TextInput
              style={styles.input}
              placeholder="https://open.spotify.com/playlist/..."
              placeholderTextColor="#666"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!isImporting}
            />

            {/* Example */}
            <Text style={styles.example}>
              Example: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={isImporting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.importButton, isImporting && styles.importButtonDisabled]}
                onPress={handleImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.importButtonText}>Import</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  instructions: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  example: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#2a2a2a',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  importButton: {
    backgroundColor: '#1DB954',
  },
  importButtonDisabled: {
    backgroundColor: '#1DB954',
    opacity: 0.6,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
