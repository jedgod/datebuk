# Firebase Setup

1. Create/select the DateBuk Firebase project.
2. Add the Android app with the exact package name.
3. Download `google-services.json` to `apps/mobile/android/app/`.
4. Enable Firebase Cloud Messaging.
5. Create/download a Firebase Admin service-account JSON.
6. Store it at `secrets/firebase/firebase-service-account.json`.
7. Run `bash scripts/create-android-keystore.sh` for release signing.
8. Store signing passwords only in a secret manager or protected CI variables.
