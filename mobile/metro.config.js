const { getDefaultConfig } = require('expo/metro-config');
// const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Temporarily disabled NativeWind - known issue causing Metro to hang at 0%
// See: https://github.com/nativewind/nativewind/issues/1417
// module.exports = withNativeWind(config, { input: './global.css' });
module.exports = config;
