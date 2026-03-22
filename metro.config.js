const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom resolver to handle react-native-track-player in Expo Go
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if we're trying to import react-native-track-player
  if (moduleName === 'react-native-track-player') {
    // Replace with our wrapper
    return context.resolveRequest(
      context,
      './src/services/audio/TrackPlayerWrapper.ts',
      platform
    );
  }
  
  // For all other modules, use the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
