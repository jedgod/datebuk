import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

type Challenge = 'TURN_HEAD' | 'SMILE';
type Slot = 'idFront' | 'selfie' | 'selfieChallenge';
type Photo = { uri: string };
type Result = { approved: boolean; reasons: string[]; canRetry: boolean; attemptsLeft?: number };

interface Props {
  navigation: any;
}

const PROMPT: Record<Challenge, string> = {
  TURN_HEAD: 'Turn your head to one side, then take the photo.',
  SMILE: 'Give a big smile, then take the photo.',
};

/**
 * Registration step shown right after sign-up on the mobile app: scan the front of a
 * government ID, then take two selfies (one a liveness challenge). The API compares the
 * selfie to the ID photo and accepts or rejects; images are analysed and not stored.
 */
export default function IdentityVerifyScreen({ navigation }: Props) {
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<{ token: string; challenge: Challenge } | null>(null);
  const [photos, setPhotos] = useState<Partial<Record<Slot, Photo>>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const goHome = () => navigation.replace('MainTabs');

  const begin = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/identity/start-in-app', { consent: true });
      setSession({ token: data.captureToken, challenge: data.challenge });
    } catch (e: any) {
      Alert.alert('Verification', e?.response?.data?.message || 'Could not start verification. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const capture = async (slot: Slot) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access in Settings to scan your ID and take a selfie.');
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      cameraType: slot === 'idFront' ? ImagePicker.CameraType.back : ImagePicker.CameraType.front,
    });
    if (!shot.canceled && shot.assets?.[0]?.uri) {
      setPhotos((p) => ({ ...p, [slot]: { uri: shot.assets[0].uri } }));
    }
  };

  const submit = async () => {
    if (!session || !photos.idFront || !photos.selfie || !photos.selfieChallenge) return;
    setBusy(true);
    try {
      const form = new FormData();
      (['idFront', 'selfie', 'selfieChallenge'] as Slot[]).forEach((slot) => {
        form.append(slot, { uri: photos[slot]!.uri, name: `${slot}.jpg`, type: 'image/jpeg' } as any);
      });
      const { data } = await api.post<Result>(`/identity/capture/${session.token}/submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(data);
      if (data.canRetry) {
        // A retry gets a fresh liveness challenge.
        const info = await api.get(`/identity/capture/${session.token}`);
        setSession({ token: session.token, challenge: info.data.challenge });
        setPhotos({});
      }
    } catch (e: any) {
      Alert.alert('Verification', e?.response?.data?.message || 'We could not process your photos. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const slotRow = (slot: Slot, title: string, hint: string) => (
    <View style={styles.card} key={slot}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      {photos[slot] && <Image source={{ uri: photos[slot]!.uri }} style={styles.preview} />}
      <TouchableOpacity style={styles.secondaryButton} onPress={() => capture(slot)} disabled={busy}>
        <Text style={styles.secondaryText}>{photos[slot] ? 'Retake' : 'Open camera'}</Text>
      </TouchableOpacity>
    </View>
  );

  const finished = result && !result.canRetry;
  const ready = !!(photos.idFront && photos.selfie && photos.selfieChallenge);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Verify your identity</Text>

      {finished ? (
        <View style={[styles.banner, result!.approved ? styles.ok : styles.bad]}>
          <Text style={styles.bannerTitle}>{result!.approved ? "You're verified!" : "We couldn't verify you."}</Text>
          {!result!.approved && result!.reasons.map((r) => <Text key={r} style={styles.reason}>• {r}</Text>)}
          <TouchableOpacity style={styles.primaryButton} onPress={goHome}>
            <Text style={styles.primaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      ) : !session ? (
        <View>
          <Text style={styles.body}>
            To keep DateBuk real, scan the front of your government ID and take two quick selfies. We compare your face
            to your ID photo and check you&apos;re a live person.
          </Text>
          <TouchableOpacity style={styles.consentRow} onPress={() => setConsent((c) => !c)}>
            <Text style={styles.checkbox}>{consent ? '☑' : '☐'}</Text>
            <Text style={styles.consentText}>
              I consent to DateBuk processing my ID and face images to verify my identity and age. Images are analysed
              and not stored; only the result is kept.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, (!consent || busy) && styles.disabled]}
            onPress={begin}
            disabled={!consent || busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Start</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={goHome}>
            <Text style={styles.skip}>Do this later</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {result && !result.approved && (
            <View style={[styles.banner, styles.warn]}>
              <Text style={styles.bannerTitle}>That didn&apos;t pass — {result.attemptsLeft ?? 0} attempt(s) left.</Text>
              {result.reasons.map((r) => <Text key={r} style={styles.reason}>• {r}</Text>)}
            </View>
          )}
          {slotRow('idFront', '1. Front of your ID', 'Fit the whole card in view, no glare.')}
          {slotRow('selfie', '2. Selfie — look straight ahead', 'Face centred, eyes open, neutral expression.')}
          {slotRow('selfieChallenge', '3. Selfie — liveness check', PROMPT[session.challenge])}
          <TouchableOpacity
            style={[styles.primaryButton, (!ready || busy) && styles.disabled]}
            onPress={submit}
            disabled={!ready || busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Submit for verification</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 56, backgroundColor: '#FDF2F8', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 12 },
  body: { fontSize: 15, color: '#4B5563', marginBottom: 16, lineHeight: 22 },
  consentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  checkbox: { fontSize: 22, color: '#7C3AED' },
  consentText: { flex: 1, fontSize: 13, color: '#374151' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  hint: { color: '#6B7280', marginVertical: 6 },
  preview: { height: 150, borderRadius: 8, marginBottom: 8 },
  primaryButton: { backgroundColor: '#EC4899', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  secondaryText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  skip: { textAlign: 'center', color: '#6B7280', marginTop: 16, textDecorationLine: 'underline' },
  banner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  ok: { backgroundColor: '#DCFCE7' },
  bad: { backgroundColor: '#FEE2E2' },
  warn: { backgroundColor: '#FEF3C7' },
  bannerTitle: { fontWeight: '700', fontSize: 16, marginBottom: 6, color: '#111827' },
  reason: { color: '#374151', marginTop: 2 },
});
