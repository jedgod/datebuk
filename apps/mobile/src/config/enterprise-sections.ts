export type EnterpriseFeatureItem = {
  label: string;
  emoji: string;
  route?: "Swipe" | "Matches" | "Profile";
};

export type EnterpriseFeatureSection = {
  title: string;
  emoji: string;
  items: EnterpriseFeatureItem[];
};

export const enterpriseSections: EnterpriseFeatureSection[] = [
  {
    title: "DASHBOARD",
    emoji: "🏠",
    items: [
      { label: "Overview", emoji: "📊", route: "Swipe" },
      { label: "Activity Feed", emoji: "📈" },
      { label: "Likes Received", emoji: "💌", route: "Matches" },
      { label: "Likes Sent", emoji: "💘" },
      { label: "Favorites", emoji: "⭐" },
      { label: "Profile Visitors", emoji: "👀" },
    ],
  },
  {
    title: "CONNECT",
    emoji: "💬",
    items: [
      { label: "Messages", emoji: "💬", route: "Matches" },
      { label: "Voice Connect", emoji: "🎙️" },
      { label: "Video Chat", emoji: "📹" },
      { label: "Date Requests", emoji: "📅" },
    ],
  },
  {
    title: "DISCOVER",
    emoji: "🧭",
    items: [
      { label: "Browse Profiles", emoji: "🔎", route: "Swipe" },
      { label: "Nearby Singles", emoji: "📍" },
      { label: "Smart Match AI", emoji: "🤖" },
      { label: "Events & Meetups", emoji: "🎉" },
    ],
  },
  {
    title: "PROFILE TOOLS",
    emoji: "🧩",
    items: [
      { label: "Profile", emoji: "👤", route: "Profile" },
      { label: "Verification Center", emoji: "✅" },
      { label: "Profile Analytics", emoji: "📈" },
      { label: "Date Planner", emoji: "🗓️" },
      { label: "Availability Calendar", emoji: "🕒" },
    ],
  },
  {
    title: "PREMIUM",
    emoji: "💎",
    items: [
      { label: "Boost Profile", emoji: "🚀" },
      { label: "Spotlight", emoji: "🌟" },
      { label: "Premium Filters", emoji: "🎯" },
    ],
  },
  {
    title: "SAFETY",
    emoji: "🛡️",
    items: [
      { label: "Identity Verification", emoji: "🪪" },
      { label: "Report & Block", emoji: "🚫" },
      { label: "Privacy Controls", emoji: "🔒" },
    ],
  },
];
