export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  bio?: string;
  location?: string;
  photos?: string[];
  voiceIntroKey?: string;
  verified?: boolean;
  role?: string;
}

export interface Profile extends User {
  interests?: string[];
  lookingFor?: string;
  height?: number;
  education?: string;
  occupation?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  // ISO date string (YYYY-MM-DD). The server independently computes age from
  // this and rejects signup for anyone under 18 — this is not just a display
  // field, it is the actual age-gate input.
  dateOfBirth: string;
  // Must be true to submit; enforced again server-side (SignupDto.ageConsent).
  ageConsent: boolean;
}

export interface Match {
  id: string;
  user: Profile;
  matchedAt: string;
  compatibility?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface SwipeAction {
  profileId: string;
  action: 'like' | 'dislike' | 'superlike';
}
