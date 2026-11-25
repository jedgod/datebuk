import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './secureStorage';
import api from './api';
import { AuthResponse, LoginCredentials, SignUpData, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    await secureStorage.setAccessToken(response.data.accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', { ...data, displayName: data.name });
    await secureStorage.setAccessToken(response.data.accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async logout(): Promise<void> {
    await secureStorage.clearAccessToken();
    await AsyncStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await secureStorage.getAccessToken();
      return token !== null && token !== undefined && token.length > 0;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },
};
