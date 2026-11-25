import api from './api';
import { Profile } from '../types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const response = await api.get<Profile>(`/profiles/${userId}`);
    return response.data;
  },

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    const response = await api.patch<Profile>('/profiles/me', data);
    return response.data;
  },

  async getRecommendations(): Promise<Profile[]> {
    const response = await api.get<Profile[]>('/profiles/recommendations');
    return response.data;
  },

};
