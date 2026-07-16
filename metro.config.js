let getDefaultConfig, withNativeWind;
try {
  getDefaultConfig = require("expo/metro-config").getDefaultConfig;
} catch (e) {
  console.error('[metro.config.js] FAILED to require expo/metro-config:', e.message, e.code);
  throw e;
}
try {
  withNativeWind = require("nativewind/metro").withNativeWind;
} catch (e) {
  console.error('[metro.config.js] FAILED to require nativewind/metro:', e.message, e.code);
  throw e;
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
});
