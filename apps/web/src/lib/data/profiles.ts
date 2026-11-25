export type PreviewProfile = {
  id: string;
  name: string;
  age: number;
  location: string;
  photo: string;
  intent: string;
  tagline: string;
  interests: string[];
  isBlurred?: boolean;
};

type PreviewQuery = {
  intent?: string | null;
  limit?: number;
  randomize?: boolean;
  blurSensitive?: boolean;
};

const PREVIEW_PROFILES: PreviewProfile[] = [
  {
    id: "pp_001",
    name: "Avery",
    age: 28,
    location: "Brooklyn, NY",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    intent: "PROFESSIONAL",
    tagline: "Coffee shop strategist with a love for long walks.",
    interests: ["coffee", "walking", "design"],
  },
  {
    id: "pp_002",
    name: "Jordan",
    age: 26,
    location: "Arlington, VA",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    intent: "CASUAL",
    tagline: "Weekend chef. Weekday playlist curator.",
    interests: ["cooking", "music", "parks"],
  },
  {
    id: "pp_003",
    name: "Riley",
    age: 29,
    location: "Baltimore, MD",
    photo: "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=900&q=80",
    intent: "FAITH",
    tagline: "Grounded, curious, and building a calm life.",
    interests: ["reading", "community", "travel"],
  },
  {
    id: "pp_004",
    name: "Morgan",
    age: 31,
    location: "Alexandria, VA",
    photo: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    intent: "PROFESSIONAL",
    tagline: "Studio founder. Seeking a steady, smart connection.",
    interests: ["startups", "pilates", "film"],
  },
  {
    id: "pp_005",
    name: "Kai",
    age: 27,
    location: "Washington, DC",
    photo: "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=900&q=80",
    intent: "CASUAL",
    tagline: "City explorer. Always down for a new spot.",
    interests: ["food", "museums", "biking"],
  },
  {
    id: "pp_006",
    name: "Taylor",
    age: 30,
    location: "Silver Spring, MD",
    photo: "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=900&q=80",
    intent: "FAITH",
    tagline: "Faith-led and future-focused. Looking for balance.",
    interests: ["volunteering", "music", "hiking"],
  },
  {
    id: "pp_007",
    name: "Quinn",
    age: 24,
    location: "Tysons, VA",
    photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80",
    intent: "CASUAL",
    tagline: "Low-stakes laughs and good conversation.",
    interests: ["comedy", "snacks", "skating"],
  },
  {
    id: "pp_008",
    name: "Sage",
    age: 33,
    location: "Annapolis, MD",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
    intent: "PROFESSIONAL",
    tagline: "Structured days, soft weekends.",
    interests: ["sailing", "books", "cooking"],
  },
  {
    id: "pp_009",
    name: "Parker",
    age: 29,
    location: "Philadelphia, PA",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    intent: "FAITH",
    tagline: "Purpose-driven and community-minded.",
    interests: ["community", "sports", "history"],
  },
  {
    id: "pp_010",
    name: "Emerson",
    age: 25,
    location: "Richmond, VA",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    intent: "CASUAL",
    tagline: "New city, new routines, open to real people.",
    interests: ["fitness", "coffee", "art"],
  },
  {
    id: "pp_011",
    name: "Hayden",
    age: 32,
    location: "Bowie, MD",
    photo: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    intent: "PROFESSIONAL",
    tagline: "Looking for intentional, steady energy.",
    interests: ["finance", "gardening", "running"],
  },
  {
    id: "pp_012",
    name: "Rowan",
    age: 27,
    location: "Fairfax, VA",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
    intent: "FAITH",
    tagline: "Slow mornings and meaningful conversations.",
    interests: ["baking", "faith", "journaling"],
  },
];

function normalizeIntent(intent?: string | null) {
  return intent ? String(intent).trim().toUpperCase() : null;
}

function shuffle<T>(items: T[]) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export async function getPreviewProfiles({ intent, limit = 24, randomize = false, blurSensitive = false }: PreviewQuery) {
  const normalized = normalizeIntent(intent);
  const filtered = normalized
    ? PREVIEW_PROFILES.filter((p) => p.intent === normalized)
    : PREVIEW_PROFILES;

  const ordered = randomize ? shuffle(filtered) : filtered;
  const selected = ordered.slice(0, Math.max(0, limit));

  return selected.map((profile) => ({
    ...profile,
    isBlurred: blurSensitive,
  }));
}
