import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { authService } from '../services/auth';
import { profileService } from '../services/profiles';
import { uploadPrivateMedia } from '../services/private-media';

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [userId, setUserId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceIntroKey, setVoiceIntroKey] = useState<string | undefined>();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
        setName(user.name || '');
        setAge(user.age?.toString() || '');
        setBio(user.bio || '');
        setLocation(user.location || '');
        setPhotos(user.photos || []);
        setVoiceIntroKey(user.voiceIntroKey);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Enable camera access to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingMedia(true);
    try {
      const uploaded = await uploadPrivateMedia({
        uri: asset.uri,
        contentType: asset.mimeType || 'image/jpeg',
        kind: 'image',
        fileName: asset.fileName || 'profile-photo.jpg',
      });
      setPhotos((current) => [uploaded.key, ...current].slice(0, 6));
      Alert.alert('Photo secured', 'The photo was encrypted in private object storage.');
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not upload photo');
    } finally {
      setUploadingMedia(false);
    }
  };

  const toggleVoiceIntro = async () => {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
      if (!audioRecorder.uri) {
        Alert.alert('Recording failed', 'No audio recording was created.');
        return;
      }
      setUploadingMedia(true);
      try {
        const uploaded = await uploadPrivateMedia({
          uri: audioRecorder.uri,
          contentType: Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4',
          kind: 'audio',
          fileName: Platform.OS === 'web' ? 'voice-intro.webm' : 'voice-intro.m4a',
        });
        setVoiceIntroKey(uploaded.key);
        Alert.alert('Voice intro secured', 'The recording was encrypted in private object storage.');
      } catch (error) {
        Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not upload voice intro');
      } finally {
        setUploadingMedia(false);
      }
      return;
    }

    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone permission required', 'Enable microphone access to record a voice intro.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record({ forDuration: 30 });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      await profileService.updateProfile({
        name,
        age: age ? parseInt(age) : undefined,
        bio,
        location,
        photos,
        voiceIntroKey,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={2}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City, Country"
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Private profile media</Text>
          <Text style={styles.helper}>
            Camera and microphone captures are uploaded with short-lived signed URLs and are not public.
          </Text>
          <View style={styles.mediaActions}>
            <TouchableOpacity
              style={[styles.mediaButton, uploadingMedia && styles.buttonDisabled]}
              onPress={() => void capturePhoto()}
              disabled={uploadingMedia || recorderState.isRecording}
            >
              <Text style={styles.mediaButtonText}>
                {photos.length ? 'Retake photo' : 'Take photo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaButton, recorderState.isRecording && styles.recordingButton, uploadingMedia && styles.buttonDisabled]}
              onPress={() => void toggleVoiceIntro()}
              disabled={uploadingMedia}
            >
              <Text style={styles.mediaButtonText}>
                {recorderState.isRecording ? 'Stop & upload' : voiceIntroKey ? 'Replace voice intro' : 'Record voice intro'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving || uploadingMedia || recorderState.isRecording}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  helper: {
    color: '#666',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  recordingButton: {
    backgroundColor: '#DC2626',
  },
  mediaButtonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
