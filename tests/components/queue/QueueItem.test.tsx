import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueueItem } from '@/components/queue/QueueItem';

const mockTrack = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  url: 'http://test.mp3',
  duration: 245, // 4:05
  artwork: 'http://artwork.jpg',
};

describe('QueueItem', () => {
  const mockOnPress = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders track info correctly', () => {
    const { getByText } = render(
      <QueueItem
        track={mockTrack}
        index={0}
        isCurrent={false}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('Test Track')).toBeTruthy();
    expect(getByText('Test Artist • 4:05')).toBeTruthy();
  });

  it('formats duration correctly', () => {
    const shortTrack = { ...mockTrack, duration: 65 };
    const { getByText } = render(
      <QueueItem
        track={shortTrack}
        index={0}
        isCurrent={false}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('Test Artist • 1:05')).toBeTruthy();
  });

  it('calls onPress with index when tapped', () => {
    const { getByText } = render(
      <QueueItem
        track={mockTrack}
        index={3}
        isCurrent={false}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    fireEvent.press(getByText('Test Track'));
    expect(mockOnPress).toHaveBeenCalledWith(3);
  });

  it('calls onRemove with index when remove button pressed', () => {
    const { getByLabelText } = render(
      <QueueItem
        track={mockTrack}
        index={5}
        isCurrent={false}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = getByLabelText('Remove from queue');
    fireEvent.press(removeButton);
    expect(mockOnRemove).toHaveBeenCalledWith(5);
  });

  it('shows current track with different styling', () => {
    const { getByTestId } = render(
      <QueueItem
        track={mockTrack}
        index={0}
        isCurrent={true}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    const container = getByTestId('queue-item-container');
    // When current, should have #E5F3FF background color
    expect(container.props.style.backgroundColor).toBe('#E5F3FF');
  });

  it('renders without artwork', () => {
    const trackNoArt = { ...mockTrack, artwork: undefined };
    const { getByText } = render(
      <QueueItem
        track={trackNoArt}
        index={0}
        isCurrent={false}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    // Should show placeholder
    expect(getByText('♪')).toBeTruthy();
  });
});
