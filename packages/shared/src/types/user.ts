export type UUID = string;

export type Gender = "male" | "female" | "nonbinary" | "other" | "prefer_not_to_say";

export interface User {
  id: UUID;
  email: string;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
}

export interface Profile {
  id: UUID;
  userId: UUID;
  displayName: string;
  age: number;
  gender: Gender;
  bio?: string | null;
  photos: string[];
  location?: { lat: number; lng: number; city?: string } | null;
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}
