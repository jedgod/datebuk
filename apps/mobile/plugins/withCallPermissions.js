const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

function withCallPermissions(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSMicrophoneUsageDescription =
      cfg.modResults.NSMicrophoneUsageDescription ||
      "DateBuk uses your microphone for voice and video calls.";
    cfg.modResults.NSCameraUsageDescription =
      cfg.modResults.NSCameraUsageDescription ||
      "DateBuk uses your camera for video calls.";

    const existingModes = cfg.modResults.UIBackgroundModes || [];
    const mergedModes = new Set([...existingModes, "audio", "voip", "remote-notification"]);
    cfg.modResults.UIBackgroundModes = Array.from(mergedModes);
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    const usesPermissions = cfg.modResults.manifest["uses-permission"] || [];
    const addPermission = (name) => {
      const exists = usesPermissions.some((item) => item.$["android:name"] === name);
      if (!exists) {
        usesPermissions.push({ $: { "android:name": name } });
      }
    };

    addPermission("android.permission.CAMERA");
    addPermission("android.permission.RECORD_AUDIO");
    addPermission("android.permission.POST_NOTIFICATIONS");
    addPermission("android.permission.FOREGROUND_SERVICE");
    addPermission("android.permission.FOREGROUND_SERVICE_MICROPHONE");
    addPermission("android.permission.FOREGROUND_SERVICE_CAMERA");
    addPermission("android.permission.BLUETOOTH_CONNECT");

    cfg.modResults.manifest["uses-permission"] = usesPermissions;
    return cfg;
  });

  return config;
}

module.exports = withCallPermissions;
