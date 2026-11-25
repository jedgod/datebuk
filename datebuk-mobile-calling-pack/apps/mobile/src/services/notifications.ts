import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true })
});

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('calls', {
      name: 'Incoming calls', importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250], sound: 'default', lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  await fetch(`${process.env.EXPO_PUBLIC_API_URL}/push/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, token })
  });
  return token;
}

export async function showLocalIncomingCall(callerName: string, callId: string, media: 'voice'|'video') {
  await Notifications.scheduleNotificationAsync({
    content: { title: `Incoming ${media} call`, body: `${callerName} is calling`, sound: 'default', data: { callId, media }, categoryIdentifier: 'incoming-call' },
    trigger: null
  });
}
