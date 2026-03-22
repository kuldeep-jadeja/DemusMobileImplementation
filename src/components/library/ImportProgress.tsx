import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getPlaylistStatus } from '../../services/playlistService';
import { PlaylistStatus } from '../../types';

type ImportProgressProps = {
  playlistId: string;
  initialStatus?: PlaylistStatus;
  initialProgress?: number;
  onComplete?: () => void;
};

export function ImportProgress({
  playlistId,
  initialStatus = 'imported',
  initialProgress = 0,
  onComplete,
}: ImportProgressProps) {
  const [status, setStatus] = useState<PlaylistStatus>(initialStatus);
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    // Only poll if status is not terminal
    if (status === 'ready' || status === 'error' || status === 'paused') {
      if (status === 'ready' && onComplete) {
        onComplete();
      }
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const statusData = await getPlaylistStatus(playlistId);
        setStatus(statusData.status);
        setProgress(statusData.importProgress);

        // Stop polling when done
        if (statusData.status === 'ready' || statusData.status === 'error' || statusData.status === 'paused') {
          clearInterval(pollInterval);
          if (statusData.status === 'ready' && onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('Error polling playlist status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [playlistId, status, onComplete]);

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return '#10b981';
      case 'matching':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'paused':
        return '#6b7280';
      default:
        return '#3b82f6';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'imported':
        return 'Starting import...';
      case 'matching':
        return 'Matching tracks with YouTube...';
      case 'ready':
        return 'Ready to play!';
      case 'paused':
        return 'Import paused';
      case 'error':
        return 'Import failed';
      default:
        return 'Processing...';
    }
  };

  const showProgressBar = status === 'matching' || (status === 'imported' && progress > 0);
  const showSpinner = status === 'matching' || status === 'imported';

  return (
    <View style={styles.container}>
      {/* Status Indicator */}
      <View style={styles.statusRow}>
        {showSpinner && (
          <ActivityIndicator
            size="small"
            color={getStatusColor()}
            style={styles.spinner}
          />
        )}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {/* Progress Bar */}
      {showProgressBar && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: getStatusColor() },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}

      {/* Additional Info */}
      {status === 'matching' && (
        <Text style={styles.infoText}>
          This may take a few minutes depending on playlist size
        </Text>
      )}
      {status === 'paused' && (
        <Text style={styles.infoText}>
          Import paused due to rate limiting. Will resume automatically.
        </Text>
      )}
      {status === 'error' && (
        <Text style={styles.infoText}>
          An error occurred during import. Please try again later.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spinner: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    minWidth: 45,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    lineHeight: 16,
  },
});
