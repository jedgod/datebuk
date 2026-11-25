/**
 * Mobile SMS Verification Component
 * React Native modal for SMS verification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMobileSmsVerification } from '../hooks/useMobileSecurity';

interface MobileSmsVerificationProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  initialPhone?: string;
}

export function MobileSmsVerification({
  visible,
  onSuccess,
  onCancel,
  initialPhone = '',
}: MobileSmsVerificationProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const { send, verify, isVerifying } = useMobileSmsVerification();

  const handleSendCode = async () => {
    setError(null);

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    const success = await send(phone);
    if (success) {
      setStage('code');
    } else {
      setError('Failed to send verification code. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    setError(null);

    if (!code || code.length < 4) {
      setError('Please enter a valid code');
      return;
    }

    const success = await verify(phone, code);
    if (success) {
      Alert.alert('Success', 'SMS verification completed!');
      handleReset();
      onSuccess();
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  const handleReset = () => {
    setPhone(initialPhone);
    setCode('');
    setStage('phone');
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <Text style={styles.title}>Security Verification</Text>
          <Text style={styles.subtitle}>
            We detected unusual activity. Please verify your identity.
          </Text>

          {stage === 'phone' ? (
            <View style={styles.form}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                editable={!isVerifying}
                keyboardType="phone-pad"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, isVerifying && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Verification Code</Text>
              <Text style={styles.subtitle}>Code sent to {phone}</Text>

              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor="#999"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                editable={!isVerifying}
                keyboardType="number-pad"
                maxLength={6}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, isVerifying && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setStage('phone');
                  setCode('');
                  setError(null);
                }}
              >
                <Text style={styles.secondaryButtonText}>Change Number</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  form: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});
