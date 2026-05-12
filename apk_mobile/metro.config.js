const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp');

config.resolver.extraNodeModules = {
  'fbjs/lib/warning': path.resolve(__dirname, 'shims/fbjs-warning.js'),
};

module.exports = config;
