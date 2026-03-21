import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '@/components/player/ProgressBar';

// Mock PlaybackService
jest.mock('@/services/audio/PlaybackService', () => ({
  seekTo: jest.fn(),
}));

describe('ProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with position and duration', () => {
    const { getByText } = render(
      <ProgressBar position={34} duration={222} />
    );

    // Check time labels are formatted correctly
    expect(getByText('0:34')).toBeTruthy();
    expect(getByText('3:42')).toBeTruthy();
  });

  it('formats time correctly for different durations', () => {
    const { getByText, rerender, getAllByText } = render(
      <ProgressBar position={0} duration={65} />
    );

    expect(getByText('0:00')).toBeTruthy();
    expect(getByText('1:05')).toBeTruthy();

    rerender(<ProgressBar position={725} duration={725} />);
    // When position equals duration, both time labels show the same value
    const timeLabels = getAllByText('12:05');
    expect(timeLabels).toHaveLength(2);
  });

  it('handles zero duration gracefully', () => {
    const { getAllByText } = render(
      <ProgressBar position={0} duration={0} />
    );

    // Both position and duration are 0:00
    const timeLabels = getAllByText('0:00');
    expect(timeLabels).toHaveLength(2);
  });

  it('calculates progress percentage correctly', () => {
    const { getByTestId } = render(
      <ProgressBar position={60} duration={120} />
    );

    const fill = getByTestId('progress-fill');
    const styles = Array.isArray(fill.props.style) ? fill.props.style : [fill.props.style];
    const widthStyle = styles.find((s: any) => s.width !== undefined);
    expect(widthStyle?.width).toBe('50%');
  });

  it('shows full progress when position equals duration', () => {
    const { getByTestId } = render(
      <ProgressBar position={180} duration={180} />
    );

    const fill = getByTestId('progress-fill');
    const styles = Array.isArray(fill.props.style) ? fill.props.style : [fill.props.style];
    const widthStyle = styles.find((s: any) => s.width !== undefined);
    expect(widthStyle?.width).toBe('100%');
  });

  it('shows zero progress at start', () => {
    const { getByTestId } = render(
      <ProgressBar position={0} duration={240} />
    );

    const fill = getByTestId('progress-fill');
    const styles = Array.isArray(fill.props.style) ? fill.props.style : [fill.props.style];
    const widthStyle = styles.find((s: any) => s.width !== undefined);
    expect(widthStyle?.width).toBe('0%');
  });
});
