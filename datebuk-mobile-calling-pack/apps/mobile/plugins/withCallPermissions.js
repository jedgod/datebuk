const { withAndroidManifest } = require('@expo/config-plugins');
module.exports = config => withAndroidManifest(config, cfg => {
  const app = cfg.modResults.manifest.application?.[0];
  if (app) app.$['android:usesCleartextTraffic'] = 'true'; // development only; use HTTPS in production
  return cfg;
});
