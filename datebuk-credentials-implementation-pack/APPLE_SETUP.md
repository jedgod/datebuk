# Apple Setup

1. In Apple Developer, create or select the App ID matching `APNS_BUNDLE_ID`.
2. Enable Push Notifications.
3. Create an APNs authentication key and download the `.p8` file.
4. Record the Key ID and Team ID.
5. Store the key in `secrets/apple/`.
6. In Xcode enable Push Notifications and Background Modes: Voice over IP and Remote notifications.
7. Use matching development/distribution provisioning profiles.
8. Use topic `<bundle-id>.voip` for VoIP pushes.
9. Test on a physical iPhone.
