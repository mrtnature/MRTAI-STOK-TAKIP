const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Adjust Node.js module resolution for React Native 73+
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'default'
];

// Increase memory limits and optimize for large projects
config.maxWorkers = 2;
config.resetCache = true;

// Configure custom cache stores with disabled database caching
config.cacheStores = [
  new (require('metro-cache'))({}),
];

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
