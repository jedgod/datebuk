import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth';

interface SignUpScreenProps {
  navigation: any;
  onSignUpSuccess: () => void;
}

const MIN_SIGNUP_AGE = 18;
// Mirrors apps/api/src/common/security/password-policy.ts so the user gets
// instant feedback instead of a round-trip 400 for the same rule.
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default function SignUpScreen({ navigation, onSignUpSuccess }: SignUpScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !birthMonth || !birthDay || !birthYear) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const month = parseInt(birthMonth, 10);
    const day = parseInt(birthDay, 10);
    const year = parseInt(birthYear, 10);
    const dob = new Date(year, month - 1, day);
    const isValidCalendarDate =
      dob.getFullYear() === year && dob.getMonth() === month - 1 && dob.getDate() === day;

    if (!isValidCalendarDate || year < 1900 || dob > new Date()) {
      Alert.alert('Error', 'Please enter a valid date of birth');
      return;
    }

    if (calculateAge(dob) < MIN_SIGNUP_AGE) {
      Alert.alert('Age Restriction', 'You must be at least 18 years old to create an account');
      return;
    }

    if (!ageConfirmed) {
      Alert.alert(
        'Confirmation Required',
        'Please confirm you are 18+ and agree to the Terms of Service and Privacy Policy'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8 || !PASSWORD_PATTERN.test(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters and contain a letter and a number');
      return;
    }

    const dateOfBirth = `${year.toString().padStart(4, '0')}-${month
      .toString()
      .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    setLoading(true);
    try {
      await authService.signUp({
        name,
        email,
        password,
        dateOfBirth,
        ageConsent: true,
      });
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: onSignUpSuccess },
      ]);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.response?.data?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ImageBackground
        source={require('../../assets/real2datepage.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(236, 72, 153, 0.28)', 'rgba(139, 92, 246, 0.32)', 'rgba(99, 102, 241, 0.36)']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.gradient}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Join DateBuk!</Text>
            <Text style={styles.subtitle}>Create your account</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <Text style={styles.fieldLabel}>Date of Birth * (you must be 18+)</Text>
              <View style={styles.dobRow}>
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="MM"
                  placeholderTextColor="#999"
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="DD"
                  placeholderTextColor="#999"
                  value={birthDay}
                  onChangeText={setBirthDay}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, styles.dobInputYear]}
                  placeholder="YYYY"
                  placeholderTextColor="#999"
                  value={birthYear}
                  onChangeText={setBirthYear}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setAgeConfirmed((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                  {ageConfirmed && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.consentText}>
                  I confirm I am 18 or older and agree to the Terms of Service and Privacy Policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    paddingTop: 56,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 28,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    marginLeft: 2,
  },
  dobRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dobInput: {
    flex: 1,
    textAlign: 'center',
  },
  dobInputYear: {
    flex: 1.5,
    textAlign: 'center',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#c4c4c4',
    marginRight: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  consentText: {
    flex: 1,
    fontSize: 12.5,
    color: '#6b7280',
    lineHeight: 17,
  },
  button: {
    backgroundColor: '#EC4899',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#6b7280',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#EC4899',
    fontWeight: 'bold',
  },
});
