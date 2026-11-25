#!/usr/bin/env bash
set -euo pipefail
mkdir -p secrets/android
KEYSTORE="${KEYSTORE:-secrets/android/datebuk-release.keystore}"
ALIAS="${ANDROID_KEY_ALIAS:-datebuk}"
[[ ! -f "$KEYSTORE" ]] || { echo "Keystore already exists"; exit 1; }
keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE" -alias "$ALIAS" -keyalg RSA -keysize 4096 -validity 10000
chmod 600 "$KEYSTORE"
echo "Created $KEYSTORE. Back it up securely."
