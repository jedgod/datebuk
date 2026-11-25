import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';

/**
 * Bearer session tokens must live in the OS-backed Keychain/Keystore
 * (expo-secure-store), not AsyncStorage. AsyncStorage is unencrypted
 * plaintext on both platforms — readable via `adb backup`/filesystem access
 * on a rooted/jailbroken device. Non-secret cached data (the displayed user
 * profile, device fingerprint, rate-limit counters) can stay in AsyncStorage;
 * only the bearer token itself needs this module.
 */
export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },
  async clearAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },
};
