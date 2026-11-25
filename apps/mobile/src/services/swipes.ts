import api from './api';
import { SwipeAction, Match } from '../types';

export const swipeService = {
  async swipe(action: SwipeAction): Promise<{ match: boolean; matchData?: Match }> {
    const response = await api.post('/swipes', action);
    return response.data;
  },

  async getMatches(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches');
    return response.data;
  },
};
