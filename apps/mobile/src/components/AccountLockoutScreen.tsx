/**
 * Account Lockout Screen Component
 * Displayed when too many failed login attempts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';

const SUPPORT_EMAIL = 'support@datebuk.com';

interface AccountLockoutScreenProps {
  lockoutTime: number; // Unix timestamp
  onUnlocked: () => void;
}

export function AccountLockoutScreen({ lockoutTime, onUnlocked }: AccountLockoutScreenProps) {
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = lockoutTime - now;

      if (remaining <= 0) {
        onUnlocked();
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      setRemainingMinutes(minutes);
      setRemainingSeconds(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTime, onUnlocked]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={styles.title}>Account Locked</Text>
        <Text style={styles.message}>
          Too many failed login attempts. Please try again in:
        </Text>

        <View style={styles.timerContainer}>
          <Text style={styles.timer}>
            {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.docSection}>
          <Text style={styles.docTitle}>Why was my account locked?</Text>
          <Text style={styles.docText}>
            We detected multiple failed login attempts. This is a security feature to protect your
            account from unauthorized access.
          </Text>
        </View>

        <View style={styles.docSection}>
          <Text style={styles.docTitle}>What can I do?</Text>
          <Text style={styles.docText}>
            • Wait for the lockout period to end{'\n'}
            • Make sure you're using the correct password{'\n'}
            • Check your phone number is correct{'\n'}
            • Contact support if you believe this is an error
          </Text>
        </View>

        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => {
            Linking.openURL(
              `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Account locked out')}`
            ).catch((error) => console.error('Failed to open support email:', error));
          }}
        >
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  timerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ef4444',
    fontVariant: ['tabular-nums'],
  },
  docSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  docText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
