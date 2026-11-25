export const featureGroups = [
  {
    route: 'dashboard',
    title: 'Dashboard',
    items: [
      { slug: 'dashboard', name: 'Dashboard', description: 'Command center for profile activity, matches, messages, safety and subscriptions.' },
      { slug: 'explore', name: 'Explore', description: 'Browse high-intent profiles, local discovery and premium recommendations.' },
      { slug: 'matches', name: 'Matches', description: 'Track active connections and next-best actions in one place.' },
    ],
  },
  {
    route: 'connections',
    title: 'Connections',
    items: [
      { slug: 'likes-received', name: 'Likes Received', description: 'People who liked you, with accept, ignore, message and profile actions.' },
      { slug: 'likes-sent', name: 'Likes Sent', description: 'Track profiles you liked and pending connection requests.' },
      { slug: 'favorites', name: 'Favorites', description: 'Saved profiles for quick access and later follow-up.' },
      { slug: 'profile-visitors', name: 'Profile Visitors', description: 'See who viewed your profile with visitor analytics.' },
    ],
  },
  {
    route: 'communication',
    title: 'Communication',
    items: [
      { slug: 'messages', name: 'Messages', description: 'Realtime inbox for conversations, attachments and quick replies.' },
      { slug: 'voice-connect', name: 'Voice Connect', description: 'Voice messages, voice intro clips and secure voice calls.' },
      { slug: 'video-dating', name: 'Video Dating', description: 'Virtual date rooms, video introductions and scheduled calls.' },
      { slug: 'date-requests', name: 'Date Requests', description: 'Send, receive and manage proposed dates.' },
    ],
  },
  {
    route: 'discovery',
    title: 'Discovery',
    items: [
      { slug: 'nearby-singles', name: 'Nearby Singles', description: 'Location-based discovery with distance filters.' },
      { slug: 'smart-match-ai', name: 'Smart Match AI', description: 'Compatibility scoring across interests, lifestyle, values and goals.' },
      { slug: 'events-meetups', name: 'Events & Meetups', description: 'Singles events, RSVP, event chat and local meetups.' },
    ],
  },
  {
    route: 'profile',
    title: 'Profile',
    items: [
      { slug: 'my-profile', name: 'My Profile', description: 'Edit your bio, photos and preferences.' },
      { slug: 'verification-center', name: 'Verification Center', description: 'Email, phone, selfie and government ID trust verification.' },
      { slug: 'profile-analytics', name: 'Profile Analytics', description: 'Views, likes, match rate, response rate and engagement funnel.' },
      { slug: 'date-planner', name: 'Date Planner', description: 'Calendar, reminders, date ideas and availability planning.' },
    ],
  },
  {
    route: 'premium-safety',
    title: 'Premium + Safety',
    items: [
      { slug: 'premium', name: 'Premium', description: 'Plan selection, upgrade prompts and feature access.' },
      { slug: 'safety-center', name: 'Safety Center', description: 'Report, block, privacy controls, safety score and emergency contacts.' },
      { slug: 'rewards-referrals', name: 'Rewards & Referrals', description: 'Points, badges, referrals, daily check-ins and loyalty rewards.' },
      { slug: 'settings', name: 'Settings', description: 'Notification, privacy and account controls.' },
      { slug: 'help-support', name: 'Help & Support', description: 'Guided help and support shortcuts.' },
    ],
  },
  {
    route: 'admin-ops',
    title: 'Admin Ops',
    items: [
      { slug: 'audit-log', name: 'Audit Log Timeline', description: 'Moderation decisions, support changes, and policy actions over time.' },
    ],
  },
];

export const features = featureGroups.flatMap((group) => group.items.map((item) => [item.name, item.description]));

export const featureLookup = featureGroups.reduce((accumulator, group) => {
  group.items.forEach((item) => {
    accumulator[item.slug] = { ...item, groupRoute: group.route, groupTitle: group.title };
  });
  return accumulator;
}, {});

export const featureStats = [
  { label: 'New likes', value: '128' },
  { label: 'Profile visits', value: '2.4k' },
  { label: 'Conversations', value: '86' },
  { label: 'Trust score', value: '98%' },
];

export const featureSignals = [
  'Trust-first onboarding',
  'Realtime messaging',
  'Location-aware discovery',
  'Premium conversion flows',
];

export const trend = [
  { d: 'Mon', v: 42 },
  { d: 'Tue', v: 68 },
  { d: 'Wed', v: 51 },
  { d: 'Thu', v: 90 },
  { d: 'Fri', v: 112 },
  { d: 'Sat', v: 156 },
  { d: 'Sun', v: 138 },
];

export const radar = [
  { k: 'Values', v: 92 },
  { k: 'Lifestyle', v: 84 },
  { k: 'Interests', v: 96 },
  { k: 'Goals', v: 88 },
  { k: 'Personality', v: 91 },
];

export const featuredPeople = [
  { name: 'Mausia', city: 'Lagos', score: 98, online: true },
  { name: 'Puril', city: 'Abuja', score: 94, online: false },
  { name: 'Purthex', city: 'Port Harcourt', score: 100, online: true },
  { name: 'Livek', city: 'Ibadan', score: 89, online: false },
  { name: 'Nagno', city: 'Enugu', score: 92, online: true },
  { name: 'Aplick', city: 'Lekki', score: 96, online: true },
];

export const chatPeople = ['Sophia', 'Faith', 'Gigi', 'Yvette', 'Maria', 'Channelle', 'Empress'];

export const matchScorePayload = {
  interests: ['music', 'travel', 'fitness'],
  goals: ['long_term', 'family'],
  lifestyle: ['active', 'social'],
  candidate: {
    interests: ['music', 'travel', 'books'],
    goals: ['long_term', 'career'],
    lifestyle: ['active', 'social'],
  },
};

export const aiMatchSnapshot = {
  score: 92,
  label: 'Excellent Match',
  reasons: [
    'Shared relationship goals',
    'Compatible interests',
    'Lifestyle alignment',
    'Communication potential',
  ],
};

export const safetyCenterSnapshot = {
  safetyScore: 92,
  modules: ['Identity Verification', 'Report User', 'Blocked Users', 'Privacy Controls', 'Emergency Contact'],
  alerts: [],
};

export const moderationSnapshot = {
  queue: [
    { id: 'MOD-1001', type: 'profile_report', priority: 'HIGH', status: 'REVIEWING' },
    { id: 'MOD-1002', type: 'photo_review', priority: 'NORMAL', status: 'PENDING' },
  ],
  stats: { pending: 14, actioned: 83, dismissed: 21 },
};

export const supportTicketsSnapshot = [
  { id: 'TCK-1902', title: 'Unable to upload verification selfie', priority: 'HIGH', status: 'OPEN' },
  { id: 'TCK-1901', title: 'Refund request for boost add-on', priority: 'NORMAL', status: 'PENDING' },
  { id: 'TCK-1898', title: 'Message notification delay', priority: 'NORMAL', status: 'REVIEWING' },
];
