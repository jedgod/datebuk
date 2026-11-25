"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Gift,
  Lock,
  MapPin,
  MessageCircle,
  Navigation,
  Send,
  Shield,
  Sparkles,
  Star,
  UserCheck,
  UserRound,
  Users,
  WandSparkles,
} from "lucide-react";
import { EnterpriseSidebar } from "@/components/dashboard/EnterpriseSidebar";
import { MobileEnterpriseDrawer } from "@/components/dashboard/MobileEnterpriseDrawer";
import { Button } from "@/components/ui/button";
import CommunicationActivityPanel from "@/components/dashboard/CommunicationActivityPanel";
import GeoMatchingPanel from "@/components/dashboard/GeoMatchingPanel";
import { useRevenueCatEntitlements } from "@/hooks/useRevenueCatEntitlements";

const FEATURE_COPY: Record<string, { title: string; summary: string; kpis: string[] }> = {
  "activity-feed": {
    title: "Activity Feed",
    summary: "Track profile activity, recent interactions, and smart engagement prompts.",
    kpis: ["New Interactions", "Profile Events", "Engagement Score"],
  },
  "likes-received": {
    title: "Likes Received",
    summary: "Review incoming likes with priority ranking and response tools.",
    kpis: ["New Likes", "Top Admirers", "Response Rate"],
  },
  "likes-sent": {
    title: "Likes Sent",
    summary: "Monitor sent likes and conversion into matches over time.",
    kpis: ["Sent Today", "Accepted", "Conversion"],
  },
  "favorites": {
    title: "Favorites",
    summary: "Keep a curated shortlist with notes and follow-up reminders.",
    kpis: ["Saved Profiles", "High Priority", "Last Contact"],
  },
  "profile-visitors": {
    title: "Profile Visitors",
    summary: "See who viewed your profile and identify high-intent visitors.",
    kpis: ["Unique Visitors", "Return Visitors", "Hot Leads"],
  },
  "voice-connect": {
    title: "Voice Connect",
    summary: "Start audio-first introductions before moving to video.",
    kpis: ["Calls Today", "Avg Duration", "Connection Quality"],
  },
  "video-chat": {
    title: "Video Chat",
    summary: "Run face-to-face sessions with quality and safety insights.",
    kpis: ["Sessions", "Completion Rate", "Feedback Score"],
  },
  "date-requests": {
    title: "Date Requests",
    summary: "Manage pending date requests and scheduling outcomes.",
    kpis: ["Pending", "Accepted", "Declined"],
  },
  "nearby-singles": {
    title: "Nearby Singles",
    summary: "Discover local matches using distance, intent, and activity filters.",
    kpis: ["Nearby Now", "High Match", "New Local Profiles"],
  },
  "smart-match-ai": {
    title: "Smart Match AI",
    summary: "Use AI-driven recommendations tuned to compatibility signals.",
    kpis: ["AI Suggestions", "Compatibility Avg", "Acceptance Rate"],
  },
  "events-meetups": {
    title: "Events & Meetups",
    summary: "Join curated events and convert online interest into real dates.",
    kpis: ["Upcoming Events", "RSVP", "Attendance"],
  },
  "verification-center": {
    title: "Verification Center",
    summary: "Manage identity checks and trust-level upgrades in one place.",
    kpis: ["Verification Status", "Pending Checks", "Trust Tier"],
  },
  "profile-analytics": {
    title: "Profile Analytics",
    summary: "Optimize profile performance with impression and conversion insights.",
    kpis: ["Impressions", "CTR", "Match Yield"],
  },
  "date-planner": {
    title: "Date Planner",
    summary: "Build date plans with templates, reminders, and follow-up actions.",
    kpis: ["Planned Dates", "Confirmed", "Completed"],
  },
  "availability-calendar": {
    title: "Availability Calendar",
    summary: "Coordinate windows and auto-suggest ideal meeting times.",
    kpis: ["Open Slots", "Booked Slots", "Overlap Score"],
  },
  "boost-profile": {
    title: "Boost Profile",
    summary: "Increase profile visibility for limited windows with performance tracking.",
    kpis: ["Boost Credits", "Reach Uplift", "Match Lift"],
  },
  spotlight: {
    title: "Spotlight",
    summary: "Feature your profile in premium placement channels.",
    kpis: ["Spotlight Time", "Views", "Action Rate"],
  },
  "identity-verification": {
    title: "Photo Verification",
    summary: "Manage KYC-style checks and trust badges.",
    kpis: ["Verification Level", "Pending Reviews", "Badge Status"],
  },
  "report-block": {
    title: "Report & Block",
    summary: "Control user safety actions with fast moderation workflows.",
    kpis: ["Open Reports", "Resolved", "Blocked Accounts"],
  },
  "privacy-controls": {
    title: "Privacy Controls",
    summary: "Fine-tune profile exposure and communication permissions.",
    kpis: ["Visibility Mode", "Data Sharing", "Safety Flags"],
  },
  referrals: {
    title: "Referrals",
    summary: "Track referral invites, conversions, and rewards.",
    kpis: ["Invites", "Signups", "Reward Balance"],
  },
  "daily-check-in": {
    title: "Daily Check-In",
    summary: "Earn streak rewards and unlock engagement perks.",
    kpis: ["Current Streak", "Points Today", "Milestones"],
  },
  badges: {
    title: "Badges",
    summary: "Showcase social proof and account achievements.",
    kpis: ["Earned Badges", "In Progress", "Rare Tier"],
  },
};

const WORKSPACE_COPY: Record<string, { title: string; cards: { title: string; text: string }[] }> = {
  "activity-feed": {
    title: "Live Activity Stream",
    cards: [
      { title: "Recent Signals", text: "Profile views, likes, and message replies grouped by recency." },
      { title: "Next Best Action", text: "Highlights the follow-up most likely to create momentum." },
      { title: "Quiet Hours", text: "Keeps nudges respectful when matches are offline or inactive." },
    ],
  },
  "likes-received": {
    title: "Incoming Interest Desk",
    cards: [
      { title: "Priority Likes", text: "Ranks new likes by compatibility, intent, and verification status." },
      { title: "Fast Reply", text: "Open a profile, favorite it, or start a message from one queue." },
      { title: "Missed Chances", text: "Surfaces older likes that still have strong match potential." },
    ],
  },
  "likes-sent": {
    title: "Outbound Like Tracker",
    cards: [
      { title: "Sent Pipeline", text: "Shows which likes are pending, accepted, or ready for a follow-up." },
      { title: "Timing Insight", text: "Compares response windows so you can pace outreach." },
      { title: "Conversion Notes", text: "Adds lightweight notes to improve future match decisions." },
    ],
  },
  favorites: {
    title: "Favorites Shortlist",
    cards: [
      { title: "Saved Profiles", text: "Collects high-interest profiles with private notes." },
      { title: "Reminder Queue", text: "Creates follow-up prompts for profiles you do not want to lose." },
      { title: "Compare Fit", text: "Reviews interests, location, and intent side by side." },
    ],
  },
  "profile-visitors": {
    title: "Visitor Intelligence",
    cards: [
      { title: "Repeat Visitors", text: "Identifies people returning to your profile." },
      { title: "High Intent", text: "Flags visitors who also match your preferences." },
      { title: "Profile Lift", text: "Connects visitor behavior to profile edits and photos." },
    ],
  },
  "voice-connect": {
    title: "Audio Introduction Console",
    cards: [
      { title: "Call Queue", text: "Organizes available matches for low-pressure voice introductions." },
      { title: "Quality Check", text: "Tracks connection quality and call completion." },
      { title: "After-Call Notes", text: "Captures private impressions before moving to video." },
    ],
  },
  "video-chat": {
    title: "Video Date Control Room",
    cards: [
      { title: "Ready Rooms", text: "Starts verified video sessions with moderation hooks." },
      { title: "Session Health", text: "Monitors quality, duration, and safety outcomes." },
      { title: "Reflection", text: "Records post-date feedback and next-step interest." },
    ],
  },
  "date-requests": {
    title: "Date Request Inbox",
    cards: [
      { title: "Pending Requests", text: "Review incoming and outgoing invitations in one place." },
      { title: "Schedule Fit", text: "Matches suggested times against availability." },
      { title: "Decision History", text: "Keeps accepted, declined, and expired requests clear." },
    ],
  },
  "nearby-singles": {
    title: "Local Discovery Radar",
    cards: [
      { title: "Distance Bands", text: "Filter nearby people by distance, activity, and intent." },
      { title: "Verified First", text: "Prioritizes profiles with stronger trust signals." },
      { title: "Local Momentum", text: "Highlights profiles active in your area today." },
    ],
  },
  "smart-match-ai": {
    title: "AI Recommendation Studio",
    cards: [
      { title: "Compatibility Model", text: "Explains why each recommendation is being surfaced." },
      { title: "Preference Tuning", text: "Adjusts suggestions using likes, skips, and favorites." },
      { title: "Fresh Picks", text: "Keeps recommendations from getting stale." },
    ],
  },
  "events-meetups": {
    title: "Events Planning Board",
    cards: [
      { title: "Upcoming Events", text: "Browse curated meetups that match your interests." },
      { title: "RSVP Matchmaking", text: "See compatible people attending the same event." },
      { title: "Post-Event Follow-up", text: "Reconnect with people after the meetup ends." },
    ],
  },
  "verification-center": {
    title: "Verification Workflow",
    cards: [
      { title: "Identity Checks", text: "Track document, selfie, and account trust status." },
      { title: "Trust Badge", text: "Preview the badge shown on your dating profile." },
      { title: "Review Needs", text: "Shows missing steps before full verification." },
    ],
  },
  "profile-analytics": {
    title: "Profile Performance Lab",
    cards: [
      { title: "Impressions", text: "Measures profile reach across discovery surfaces." },
      { title: "Photo Impact", text: "Compares attention by image order and freshness." },
      { title: "Match Yield", text: "Connects views and likes to actual conversations." },
    ],
  },
  "date-planner": {
    title: "Date Planning Workspace",
    cards: [
      { title: "Plan Templates", text: "Build dinner, coffee, video, and activity-based plans." },
      { title: "Shared Details", text: "Keep time, location, and expectations easy to confirm." },
      { title: "Follow-up", text: "Create reminders for confirmation and post-date check-ins." },
    ],
  },
  "availability-calendar": {
    title: "Availability Scheduler",
    cards: [
      { title: "Open Windows", text: "Set times you are comfortable sharing with matches." },
      { title: "Overlap Finder", text: "Finds mutual availability before sending a request." },
      { title: "Calendar Privacy", text: "Shares windows without exposing private calendar details." },
    ],
  },
  "boost-profile": {
    title: "Boost Campaign Manager",
    cards: [
      { title: "Boost Window", text: "Choose the highest activity window for extra exposure." },
      { title: "Audience Reach", text: "Estimates how many profiles will see the boost." },
      { title: "Lift Report", text: "Compares views and matches before and after boosting." },
    ],
  },
  spotlight: {
    title: "Spotlight Placement",
    cards: [
      { title: "Feature Slot", text: "Manage premium placement timing and duration." },
      { title: "Creative Preview", text: "Review how your profile appears in spotlight areas." },
      { title: "Performance", text: "Track views, likes, and message starts from spotlight." },
    ],
  },
  "identity-verification": {
    title: "Identity Safety Center",
    cards: [
      { title: "Verification Status", text: "Shows identity confidence and pending checks." },
      { title: "Badge Controls", text: "Manage visibility of verification badges." },
      { title: "Review Support", text: "Escalate stuck or failed verification attempts." },
    ],
  },
  "report-block": {
    title: "Report And Block Desk",
    cards: [
      { title: "Report Flow", text: "Start a report with category, evidence, and urgency." },
      { title: "Block List", text: "Review blocked profiles and unblock when needed." },
      { title: "Safety Review", text: "Tracks support outcomes for submitted reports." },
    ],
  },
  "privacy-controls": {
    title: "Privacy Control Panel",
    cards: [
      { title: "Profile Visibility", text: "Choose who can discover or contact you." },
      { title: "Location Sharing", text: "Control approximate location and travel visibility." },
      { title: "Data Preferences", text: "Review communication, analytics, and safety settings." },
    ],
  },
  referrals: {
    title: "Referral Rewards Hub",
    cards: [
      { title: "Invite Links", text: "Create and track referral invites." },
      { title: "Conversion Status", text: "See signups, qualified users, and pending rewards." },
      { title: "Reward Balance", text: "Review earned credits and milestone bonuses." },
    ],
  },
  "daily-check-in": {
    title: "Daily Check-In Board",
    cards: [
      { title: "Today", text: "Claim the daily activity reward." },
      { title: "Streak", text: "Track streak progress and upcoming milestones." },
      { title: "Bonus Tasks", text: "Complete small actions to improve match quality." },
    ],
  },
  badges: {
    title: "Badge Collection",
    cards: [
      { title: "Earned Badges", text: "Show social proof and account achievements." },
      { title: "In Progress", text: "Track badges close to completion." },
      { title: "Rare Badges", text: "Highlight premium, safety, and community milestones." },
    ],
  },
};

type FeatureGroup =
  | "connections"
  | "communication"
  | "discovery"
  | "profile"
  | "dating-tools"
  | "premium"
  | "safety"
  | "rewards"
  | "general";

const GROUP_BY_SLUG: Record<string, FeatureGroup> = {
  "likes-received": "connections",
  "likes-sent": "connections",
  favorites: "connections",
  "profile-visitors": "connections",

  "voice-connect": "communication",
  "video-chat": "communication",
  "date-requests": "communication",

  "nearby-singles": "discovery",
  "smart-match-ai": "discovery",
  "events-meetups": "discovery",

  "verification-center": "profile",
  "profile-analytics": "profile",
  "date-planner": "dating-tools",
  "availability-calendar": "dating-tools",

  "boost-profile": "premium",
  spotlight: "premium",

  "identity-verification": "safety",
  "report-block": "safety",
  "privacy-controls": "safety",

  referrals: "rewards",
  "daily-check-in": "rewards",
  badges: "rewards",
};

const GROUP_THEME: Record<
  FeatureGroup,
  {
    background: string;
    iconClass: string;
    buttonClass: string;
    cardClass: string;
    panelClass: string;
  }
> = {
  connections: {
    background: "from-rose-50 via-orange-50 to-amber-50",
    iconClass: "text-rose-600",
    buttonClass: "border-rose-200 hover:bg-rose-50",
    cardClass: "border-rose-200 bg-white/90",
    panelClass: "border-rose-200 bg-white/95",
  },
  communication: {
    background: "from-sky-50 via-indigo-50 to-cyan-50",
    iconClass: "text-sky-600",
    buttonClass: "border-sky-200 hover:bg-sky-50",
    cardClass: "border-sky-200 bg-white/90",
    panelClass: "border-sky-200 bg-white/95",
  },
  discovery: {
    background: "from-emerald-50 via-teal-50 to-cyan-50",
    iconClass: "text-emerald-600",
    buttonClass: "border-emerald-200 hover:bg-emerald-50",
    cardClass: "border-emerald-200 bg-white/90",
    panelClass: "border-emerald-200 bg-white/95",
  },
  profile: {
    background: "from-violet-50 via-fuchsia-50 to-pink-50",
    iconClass: "text-violet-600",
    buttonClass: "border-violet-200 hover:bg-violet-50",
    cardClass: "border-violet-200 bg-white/90",
    panelClass: "border-violet-200 bg-white/95",
  },
  "dating-tools": {
    background: "from-lime-50 via-emerald-50 to-sky-50",
    iconClass: "text-teal-700",
    buttonClass: "border-teal-200 hover:bg-teal-50",
    cardClass: "border-teal-200 bg-white/90",
    panelClass: "border-teal-200 bg-white/95",
  },
  premium: {
    background: "from-amber-50 via-yellow-50 to-orange-50",
    iconClass: "text-amber-600",
    buttonClass: "border-amber-200 hover:bg-amber-50",
    cardClass: "border-amber-200 bg-white/90",
    panelClass: "border-amber-200 bg-white/95",
  },
  safety: {
    background: "from-slate-50 via-rose-50 to-red-50",
    iconClass: "text-rose-700",
    buttonClass: "border-rose-200 hover:bg-rose-50",
    cardClass: "border-rose-200 bg-white/90",
    panelClass: "border-rose-200 bg-white/95",
  },
  rewards: {
    background: "from-indigo-50 via-purple-50 to-pink-50",
    iconClass: "text-purple-600",
    buttonClass: "border-purple-200 hover:bg-purple-50",
    cardClass: "border-purple-200 bg-white/90",
    panelClass: "border-purple-200 bg-white/95",
  },
  general: {
    background: "from-purple-50 via-pink-50 to-orange-50",
    iconClass: "text-pink-600",
    buttonClass: "border-pink-200 hover:bg-pink-50",
    cardClass: "border-pink-200 bg-white/90",
    panelClass: "border-pink-200 bg-white/95",
  },
};

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveGroup(slug: string): FeatureGroup {
  return GROUP_BY_SLUG[slug] ?? "general";
}

function formatGroupLabel(group: FeatureGroup): string {
  return group.replace("-", " ");
}

function GroupBadge({ group }: { group: FeatureGroup }) {
  if (group === "connections") return <Users size={15} />;
  if (group === "communication") return <MessageCircle size={15} />;
  if (group === "discovery") return <WandSparkles size={15} />;
  if (group === "profile") return <UserRound size={15} />;
  if (group === "dating-tools") return <Calendar size={15} />;
  if (group === "premium") return <Crown size={15} />;
  if (group === "safety") return <Shield size={15} />;
  if (group === "rewards") return <Gift size={15} />;
  return <Sparkles size={15} />;
}

function StatStrip({ feature, theme }: { feature: { kpis: string[] }; theme: { cardClass: string } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {feature.kpis.map((kpi, index) => (
        <div key={kpi} className={`rounded-lg border px-4 py-3 ${theme.cardClass}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{kpi}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{index === 0 ? "Live" : "--"}</p>
        </div>
      ))}
    </div>
  );
}

type DiscoveryPlace = {
  name: string;
  detail: string;
  distance: string;
  latOffset: number;
  lngOffset: number;
  x: string;
  y: string;
  venueType?: "Pub" | "Restaurant" | "Night Club" | "Free Event" | "Ticketed Event";
  priceLabel?: string;
  ticketInfo?: string;
  ticketSalesLocation?: string;
  startsAt?: string;
  closesAt?: string;
};

const DEFAULT_LOCATION = {
  lat: 40.7128,
  lng: -74.006,
  label: "New York, NY",
};

const NEARBY_SINGLE_PLACES: DiscoveryPlace[] = [
  { name: "Avery", detail: "Verified, active nearby", distance: "0.6 mi", latOffset: 0.004, lngOffset: -0.006, x: "42%", y: "46%" },
  { name: "Maya", detail: "Coffee and live music", distance: "1.1 mi", latOffset: -0.008, lngOffset: 0.009, x: "58%", y: "38%" },
  { name: "Jordan", detail: "Weekend plans open", distance: "1.8 mi", latOffset: 0.012, lngOffset: 0.014, x: "66%", y: "58%" },
  { name: "Sam", detail: "New profile match", distance: "2.4 mi", latOffset: -0.015, lngOffset: -0.012, x: "33%", y: "63%" },
];

const EVENT_MEETUP_PLACES: DiscoveryPlace[] = [
  {
    name: "Singles Pub Social",
    detail: "Casual drinks and conversation",
    distance: "0.7 mi",
    latOffset: 0.006,
    lngOffset: 0.008,
    x: "55%",
    y: "44%",
    venueType: "Pub",
    priceLabel: "Free entry",
    ticketInfo: "No ticket required",
    ticketSalesLocation: "Pay at bar for drinks",
    startsAt: "Today, 6:30 PM",
    closesAt: "Today, 10:30 PM",
  },
  {
    name: "Dinner Match Table",
    detail: "Reserved group table for verified singles",
    distance: "1.1 mi",
    latOffset: -0.008,
    lngOffset: 0.014,
    x: "63%",
    y: "52%",
    venueType: "Restaurant",
    priceLabel: "$25 deposit",
    ticketInfo: "Table reservation ticket",
    ticketSalesLocation: "Restaurant host stand",
    startsAt: "Friday, 7:00 PM",
    closesAt: "Friday, 9:30 PM",
  },
  {
    name: "Rooftop Night Mixer",
    detail: "DJ, dancing, and speed introductions",
    distance: "1.6 mi",
    latOffset: -0.011,
    lngOffset: 0.012,
    x: "70%",
    y: "65%",
    venueType: "Night Club",
    priceLabel: "$18 ticket",
    ticketInfo: "Limited advance tickets",
    ticketSalesLocation: "Box office and online",
    startsAt: "Friday, 9:00 PM",
    closesAt: "Saturday, 2:00 AM",
  },
  {
    name: "Board Game Meetup",
    detail: "Free social games and icebreakers",
    distance: "2.1 mi",
    latOffset: 0.014,
    lngOffset: -0.011,
    x: "35%",
    y: "40%",
    venueType: "Free Event",
    priceLabel: "Free",
    ticketInfo: "RSVP only",
    ticketSalesLocation: "Community center desk",
    startsAt: "Saturday, 4:00 PM",
    closesAt: "Saturday, 7:00 PM",
  },
  {
    name: "Live Jazz Date Night",
    detail: "Ticketed show with reserved singles seating",
    distance: "2.4 mi",
    latOffset: 0.018,
    lngOffset: -0.002,
    x: "47%",
    y: "33%",
    venueType: "Ticketed Event",
    priceLabel: "$32 ticket",
    ticketInfo: "Reserved seating",
    ticketSalesLocation: "Venue box office",
    startsAt: "Saturday, 8:00 PM",
    closesAt: "Saturday, 11:30 PM",
  },
  {
    name: "Park Walk Group",
    detail: "Free daylight meetup and coffee after",
    distance: "2.8 mi",
    latOffset: -0.018,
    lngOffset: -0.006,
    x: "44%",
    y: "72%",
    venueType: "Free Event",
    priceLabel: "Free",
    ticketInfo: "Open RSVP",
    ticketSalesLocation: "No sales location",
    startsAt: "Sunday, 10:00 AM",
    closesAt: "Sunday, 12:00 PM",
  },
];

function DiscoveryMapPanel({ slug }: { slug: string }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION.label);
  const [locationStatus, setLocationStatus] = useState("Using default map center");

  const places = slug === "events-meetups" ? EVENT_MEETUP_PLACES : NEARBY_SINGLE_PLACES;
  const isEventsPage = slug === "events-meetups";
  const title = isEventsPage ? "Events Map" : "Nearby Singles Map";
  const mapDelta = 0.035;
  const bbox = [
    location.lng - mapDelta,
    location.lat - mapDelta,
    location.lng + mapDelta,
    location.lat + mapDelta,
  ].join("%2C");
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat}%2C${location.lng}`;
  const mapLink = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=14/${location.lat}/${location.lng}`;

  const resolvedPlaces = useMemo(
    () =>
      places.map((place) => ({
        ...place,
        lat: Number((location.lat + place.latOffset).toFixed(6)),
        lng: Number((location.lng + place.lngOffset).toFixed(6)),
      })),
    [location.lat, location.lng, places]
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Browser location is unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          label: "Your current area",
        };
        setLocation(nextLocation);
        setLocationLabel(nextLocation.label);
        setLocationStatus("Using your current browser location");
      },
      () => {
        setLocationStatus("Location permission not granted");
      },
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 8000 }
    );
  }, []);

  return (
    <section className="overflow-hidden rounded-lg border border-emerald-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-emerald-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-gray-600">{locationLabel} · {locationStatus}</p>
        </div>
        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
        >
          <Navigation size={16} />
          Open Map
        </a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="relative min-h-[360px] bg-emerald-50">
          <iframe
            title={title}
            src={mapSrc}
            className="h-[360px] w-full border-0"
            loading="lazy"
          />
          {resolvedPlaces.map((place) => (
            <a
              key={place.name}
              href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`}
              target="_blank"
              rel="noreferrer"
              title={`${place.name} · ${place.distance}`}
              className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
              style={{ left: place.x, top: place.y }}
            >
              <span className="rounded-full bg-emerald-700 px-2 py-1 text-xs font-bold text-white shadow-lg">
                {isEventsPage ? place.venueType : place.distance}
              </span>
              <MapPin size={28} className="fill-emerald-600 text-white drop-shadow" />
            </a>
          ))}
        </div>

        <div className="border-t border-emerald-100 bg-emerald-50/60 p-4 xl:border-l xl:border-t-0">
          <h3 className="font-bold text-gray-900">{slug === "events-meetups" ? "Local Meetups" : "Nearby Matches"}</h3>
          {isEventsPage ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Pubs", "Restaurants", "Night Clubs", "Free", "Tickets", "RSVP"].map((label) => (
                <span key={label} className="rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-xs font-bold text-emerald-800">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 space-y-3">
            {resolvedPlaces.map((place) => (
              <a
                key={place.name}
                href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-emerald-100 bg-white p-3 hover:border-emerald-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">{place.name}</p>
                  <span className="text-xs font-bold text-emerald-700">{place.distance}</span>
                </div>
                {isEventsPage ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">{place.venueType}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-700">{place.priceLabel}</span>
                  </div>
                ) : null}
                <p className="mt-1 text-sm text-gray-600">{place.detail}</p>
                {isEventsPage ? (
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    <p><span className="font-semibold text-gray-800">Starts:</span> {place.startsAt}</p>
                    <p><span className="font-semibold text-gray-800">Closes:</span> {place.closesAt}</p>
                    <p><span className="font-semibold text-gray-800">Tickets:</span> {place.ticketInfo}</p>
                    <p><span className="font-semibold text-gray-800">Sales:</span> {place.ticketSalesLocation}</p>
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-gray-500">{place.lat}, {place.lng}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DatePlannerRequestPanel() {
  const { getCurrentTier, hasAccess, loading } = useRevenueCatEntitlements();
  const [recipientType, setRecipientType] = useState("lady");
  const [recipient, setRecipient] = useState("Amara");
  const [dateType, setDateType] = useState("Dinner date");
  const [dateDay, setDateDay] = useState("Friday");
  const [dateTime, setDateTime] = useState("7:00 PM");
  const [location, setLocation] = useState("Downtown restaurant");
  const [note, setNote] = useState("Would you like to meet for a relaxed first date?");
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [dateRequestId, setDateRequestId] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState("match_amara");
  const [requests, setRequests] = useState<Array<any>>([]);
  const [messageDraft, setMessageDraft] = useState("Can we confirm this plan?");
  const [threadMessages, setThreadMessages] = useState<Array<any>>([]);
  const [threadStatus, setThreadStatus] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dateAchieved, setDateAchieved] = useState(false);
  const [partnerAttitude, setPartnerAttitude] = useState("Respectful");
  const [partnerReaction, setPartnerReaction] = useState("Positive and interested");
  const [comfortLevel, setComfortLevel] = useState("Comfortable");
  const [recommendedAction, setRecommendedAction] = useState("Encourage another date");
  const [feedbackNote, setFeedbackNote] = useState("Partner arrived on time and the conversation felt genuine.");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  const tier = getCurrentTier();
  const canPlanDate = hasAccess("premium");
  const disabled = loading || !canPlanDate;

  const meetingPresets = [
    { label: "Downtown restaurant", latitude: 40.7411, longitude: -73.9897 },
    { label: "Central park cafe", latitude: 40.7735, longitude: -73.9718 },
    { label: "Riverside lounge", latitude: 40.7214, longitude: -74.0042 },
  ];

  const mapLink = currentCoords
    ? `https://www.openstreetmap.org/?mlat=${currentCoords.latitude}&mlon=${currentCoords.longitude}#map=16/${currentCoords.latitude}/${currentCoords.longitude}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(location)}`;

  const loadRequests = async () => {
    setRequestLoading(true);
    try {
      const response = await fetch("/api/date-requests", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load date requests");
      const next = Array.isArray(data?.requests) ? data.requests : [];
      setRequests(next);
      const latest = next[0];
      if (latest?.id) {
        setDateRequestId(latest.id);
        setActiveMatchId(latest.matchId || activeMatchId);
      }
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Failed to load date requests");
    } finally {
      setRequestLoading(false);
    }
  };

  const loadThread = async (matchId: string) => {
    try {
      const response = await fetch(`/api/messages?matchId=${encodeURIComponent(matchId)}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to load thread");
      setThreadMessages(Array.isArray(data) ? data : []);
      setThreadStatus(null);
    } catch (error) {
      setThreadStatus(error instanceof Error ? error.message : "Failed to load thread");
    }
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        setCurrentCoords(next);
      },
      () => {
        // Best-effort location capture.
      },
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!canPlanDate) return;
    void loadRequests();
    const interval = window.setInterval(() => {
      void loadRequests();
      if (activeMatchId) {
        void loadThread(activeMatchId);
      }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [canPlanDate, activeMatchId]);

  useEffect(() => {
    if (!canPlanDate || !activeMatchId) return;
    void loadThread(activeMatchId);
  }, [canPlanDate, activeMatchId]);

  const buildScheduledAt = () => {
    const now = new Date();
    const normalizedDay = dateDay.toLowerCase();
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      today: now.getDay(),
    };
    const targetDow = dayMap[normalizedDay] ?? now.getDay();
    const base = new Date(now);
    const diff = (targetDow - now.getDay() + 7) % 7;
    base.setDate(now.getDate() + (diff === 0 ? 1 : diff));

    const [timePart, meridiemRaw] = dateTime.split(" ");
    const [hourRaw, minuteRaw] = (timePart || "19:00").split(":");
    let hour = Number(hourRaw);
    const minute = Number(minuteRaw || "0");
    const meridiem = (meridiemRaw || "PM").toUpperCase();
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    base.setHours(Number.isNaN(hour) ? 19 : hour, Number.isNaN(minute) ? 0 : minute, 0, 0);
    return base.toISOString();
  };

  const sendRequest = async () => {
    if (!canPlanDate) return;
    const direction = recipientType === "lady" ? "lady" : "man";
    try {
      const scheduledAt = buildScheduledAt();
      const matchId = `match_${recipient.toLowerCase()}`;
      const response = await fetch("/api/date-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          matchId,
          scheduledAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          placeName: location,
          placeAddress: location,
          latitude: currentCoords?.latitude,
          longitude: currentCoords?.longitude,
          notes: `${dateType}; ${dateDay} ${dateTime}; ${note}; direction=${direction}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to create date request");
      setDateRequestId(data.request.id);
      setActiveMatchId(matchId);
      setRequestStatus(
        `Date request queued to ${recipient} (${direction}) for ${dateDay} at ${dateTime}.`
      );
      setDateAchieved(false);
      setFeedbackStatus(null);
      await loadRequests();
      await loadThread(matchId);
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Failed to create date request");
    }
  };

  const updateRequestStatus = async (status: "accepted" | "rescheduled" | "cancelled") => {
    if (!dateRequestId) return;
    try {
      const response = await fetch("/api/date-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: dateRequestId,
          status,
          scheduledAt: status === "rescheduled" ? buildScheduledAt() : undefined,
          placeName: location,
          placeAddress: location,
          latitude: currentCoords?.latitude,
          longitude: currentCoords?.longitude,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to update date request");
      setRequestStatus(`Date request ${status}.`);
      await loadRequests();
      if (activeMatchId) {
        await loadThread(activeMatchId);
      }
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Failed to update date request");
    }
  };

  const sendPlannerMessage = async () => {
    const text = messageDraft.trim();
    if (!text || !activeMatchId) return;
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ matchId: activeMatchId, content: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to send message");
      setMessageDraft("");
      setThreadMessages((current) => [...current, data]);
    } catch (error) {
      setThreadStatus(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  const markDateAchieved = async () => {
    if (!dateRequestId) return;
    setDateAchieved((value) => !value);
    if (!dateAchieved) {
      await fetch("/api/date-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: dateRequestId, status: "completed" }),
      });
    }
  };

  const sendFeedback = async () => {
    if (!canPlanDate || !dateAchieved) return;
    try {
      const response = await fetch("/api/date-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dateRequestId,
          matchId: `match_${recipient.toLowerCase()}`,
          partnerName: recipient,
          partnerAttitude,
          partnerReaction,
          comfortLevel,
          recommendedAction,
          notes: feedbackNote,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to submit feedback");
      setFeedbackStatus(`Feedback submitted for ${recipient}. Our team can use it for trust, safety, and match-quality improvements.`);
    } catch (error) {
      setFeedbackStatus(error instanceof Error ? error.message : "Failed to submit feedback");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
        <section className="rounded-lg border border-teal-200 bg-white/95 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Request A Date</h2>
              <p className="mt-1 text-sm text-gray-600">Premium and Elite members can schedule and send date requests.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase text-teal-800">
              <Crown size={14} />
              {loading ? "Checking plan" : `${tier} plan`}
            </span>
          </div>

          {!loading && !canPlanDate ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-gray-900">Date Planner is for Premium and Elite members.</p>
              <p className="mt-1 text-sm text-gray-700">Upgrade to request dates, reserve a time, and send planning details to a match.</p>
              <Link href="/dashboard/subscription" className="mt-3 inline-flex">
                <Button className="bg-teal-700 hover:bg-teal-800">
                  <Crown size={16} className="mr-2" />
                  Upgrade
                </Button>
              </Link>
            </div>
          ) : null}

          {canPlanDate ? (
            <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/70 p-3">
              <p className="text-xs font-bold uppercase text-teal-800">Connected Modules</p>
              <p className="mt-1 text-sm text-teal-900">Date Planner is synced with Availability Calendar and messaging. Invitation updates auto-write to your thread.</p>
            </div>
          ) : null}

        <div className={`mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 ${disabled ? "opacity-60" : ""}`}>
          <label className="text-sm font-semibold text-gray-700">
            Request direction
            <select
              value={recipientType}
              disabled={disabled}
              onChange={(event) => setRecipientType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
            >
              <option value="lady">Man requesting lady</option>
              <option value="man">Lady requesting man</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Send request to
            <select
              value={recipient}
              disabled={disabled}
              onChange={(event) => setRecipient(event.target.value)}
              className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
            >
              <option>Amara</option>
              <option>Chanelle</option>
              <option>Jordan</option>
              <option>Marcus</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Date type
            <select
              value={dateType}
              disabled={disabled}
              onChange={(event) => setDateType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
            >
              <option>Dinner date</option>
              <option>Coffee meetup</option>
              <option>Video date first</option>
              <option>Event meetup</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Day
            <select
              value={dateDay}
              disabled={disabled}
              onChange={(event) => setDateDay(event.target.value)}
              className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
            >
              <option>Today</option>
              <option>Friday</option>
              <option>Saturday</option>
              <option>Sunday</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Time
            <input
              value={dateTime}
              disabled={disabled}
              onChange={(event) => setDateTime(event.target.value)}
              className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Location
            <input
              value={location}
              disabled={disabled}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Quick meeting points
            <select
              disabled={disabled}
              onChange={(event) => {
                const selected = meetingPresets.find((item) => item.label === event.target.value);
                if (!selected) return;
                setLocation(selected.label);
                setCurrentCoords({ latitude: selected.latitude, longitude: selected.longitude });
              }}
              className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
              value=""
            >
              <option value="" disabled>Select preset</option>
              {meetingPresets.map((item) => (
                <option key={item.label} value={item.label}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-gray-700">
            Message
            <textarea
              value={note}
              disabled={disabled}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 rounded-lg border border-teal-100 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">Meeting location map marker</p>
            <a href={mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800">
              <MapPin size={14} />
              Open location map
            </a>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {currentCoords ? `${currentCoords.latitude}, ${currentCoords.longitude}` : "Using selected place label; set browser location for precise markers."}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={disabled} onClick={sendRequest} className="bg-teal-700 hover:bg-teal-800">
            <Send size={16} className="mr-2" />
            Send Date Request
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button disabled={disabled || !dateRequestId} variant="outline" className="border-teal-200 hover:bg-teal-50" onClick={() => void updateRequestStatus("accepted")}>Confirm</Button>
            <Button disabled={disabled || !dateRequestId} variant="outline" className="border-teal-200 hover:bg-teal-50" onClick={() => void updateRequestStatus("rescheduled")}>Reschedule</Button>
            <Button disabled={disabled || !dateRequestId} variant="outline" className="border-rose-200 hover:bg-rose-50" onClick={() => void updateRequestStatus("cancelled")}>Cancel</Button>
          </div>
          {requestStatus ? <p className="text-sm font-semibold text-teal-800">{requestStatus}</p> : null}
        </div>
        </section>

        <section className="rounded-lg border border-white/70 bg-white/90 p-5">
          <h2 className="text-lg font-bold">Request Preview</h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["To", recipient],
              ["Direction", recipientType === "lady" ? "Man to lady" : "Lady to man"],
              ["Plan", dateType],
              ["Schedule", `${dateDay} at ${dateTime}`],
              ["Location", location],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-teal-100 bg-teal-50/70 p-3">
                <p className="text-xs font-bold uppercase text-teal-800">{label}</p>
                <p className="mt-1 font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-sky-200 bg-white/95 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">Planner Messages</h2>
          <span className="text-xs font-semibold text-sky-700">Match thread: {activeMatchId}</span>
        </div>

        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-sky-100 bg-sky-50/40 p-3">
          {threadMessages.length === 0 ? (
            <p className="text-sm text-gray-600">No messages yet for this date thread.</p>
          ) : (
            threadMessages.map((message) => (
              <div key={message.id} className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                <p className="text-xs font-bold uppercase text-sky-700">{message.senderId}</p>
                <p className="mt-1 text-sm text-gray-800">{message.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={messageDraft}
            onChange={(event) => setMessageDraft(event.target.value)}
            disabled={disabled}
            className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm"
            placeholder="Send a confirmation or reschedule message"
          />
          <Button disabled={disabled || !activeMatchId} onClick={sendPlannerMessage} className="bg-sky-700 hover:bg-sky-800">
            Send Message
          </Button>
        </div>
        {threadStatus ? <p className="mt-2 text-sm font-semibold text-rose-700">{threadStatus}</p> : null}
      </section>

      <section className="rounded-lg border border-teal-200 bg-white/95 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Invitation Timeline</h2>
          <Button variant="outline" className="border-teal-200 hover:bg-teal-50" onClick={() => void loadRequests()}>
            {requestLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-gray-600">No date requests yet.</p>
          ) : (
            requests.slice(0, 6).map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => {
                  setDateRequestId(request.id);
                  setActiveMatchId(request.matchId || activeMatchId);
                }}
                className="w-full rounded-lg border border-teal-100 bg-teal-50/70 p-3 text-left hover:border-teal-300"
              >
                <p className="text-xs font-bold uppercase text-teal-800">{request.status}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{new Date(request.scheduledAt).toLocaleString()} • {request.placeName}</p>
                <p className="mt-1 text-xs text-gray-600">matchId: {request.matchId}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-indigo-200 bg-white/95 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Post-Date Feedback</h2>
            <p className="mt-1 text-sm text-gray-600">After the planned date is achieved, share feedback for safety, partner quality, and service improvement.</p>
          </div>
          <Button
            disabled={disabled || !requestStatus}
            onClick={markDateAchieved}
            variant="outline"
            className="border-indigo-200 hover:bg-indigo-50"
          >
            <CheckCircle2 size={16} className="mr-2" />
            {dateAchieved ? "Date Achieved" : "Mark Date Achieved"}
          </Button>
        </div>

        {!requestStatus ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Send a date request first. Feedback opens after the planned date is marked achieved.
          </div>
        ) : null}

        <div className={`mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 ${disabled || !dateAchieved ? "opacity-60" : ""}`}>
          <label className="text-sm font-semibold text-gray-700">
            Partner attitude
            <select
              value={partnerAttitude}
              disabled={disabled || !dateAchieved}
              onChange={(event) => setPartnerAttitude(event.target.value)}
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            >
              <option>Respectful</option>
              <option>Friendly</option>
              <option>Late but polite</option>
              <option>Rude</option>
              <option>Concerning</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Partner reaction
            <select
              value={partnerReaction}
              disabled={disabled || !dateAchieved}
              onChange={(event) => setPartnerReaction(event.target.value)}
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            >
              <option>Positive and interested</option>
              <option>Polite but not interested</option>
              <option>Nervous</option>
              <option>Unresponsive</option>
              <option>Aggressive or unsafe</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Comfort level
            <select
              value={comfortLevel}
              disabled={disabled || !dateAchieved}
              onChange={(event) => setComfortLevel(event.target.value)}
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            >
              <option>Comfortable</option>
              <option>Mostly comfortable</option>
              <option>Unsure</option>
              <option>Uncomfortable</option>
              <option>Safety concern</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Recommended action
            <select
              value={recommendedAction}
              disabled={disabled || !dateAchieved}
              onChange={(event) => setRecommendedAction(event.target.value)}
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            >
              <option>Encourage another date</option>
              <option>Improve match suggestions</option>
              <option>Send dating tips</option>
              <option>Review profile behavior</option>
              <option>Escalate to safety team</option>
            </select>
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-gray-700">
            Feedback notes
            <textarea
              value={feedbackNote}
              disabled={disabled || !dateAchieved}
              onChange={(event) => setFeedbackNote(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={disabled || !dateAchieved} onClick={sendFeedback} className="bg-indigo-700 hover:bg-indigo-800">
            <Send size={16} className="mr-2" />
            Submit Feedback
          </Button>
          {feedbackStatus ? <p className="text-sm font-semibold text-indigo-800">{feedbackStatus}</p> : null}
        </div>
      </section>
    </div>
  );
}

function AvailabilityCalendarPanel() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [events, setEvents] = useState<Array<any>>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [calendarMessageDraft, setCalendarMessageDraft] = useState("I can do this time. Confirming from calendar.");

  const slotOptions = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  const weekDays = useMemo(() => {
    const now = new Date();
    const mondayOffset = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const label = date.toLocaleDateString(undefined, { weekday: "short" });
      return {
        date,
        dateKey,
        label,
        dayNumber: date.getDate(),
      };
    });
  }, [weekOffset]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/availability", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load availability");

      const map: Record<string, string[]> = {};
      for (const row of data.availability || []) {
        if (!row?.date) continue;
        map[row.date] = Array.isArray(row.slots) ? row.slots : [];
      }
      setAvailability(map);
      setEvents(Array.isArray(data.events) ? data.events : []);
      if (Array.isArray(data.events) && data.events.length > 0 && !selectedEventId) {
        setSelectedEventId(data.events[0].id);
      }
      setSyncStatus("Calendar synchronized with planner and invitations.");
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Failed to sync availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalendarData();
    const interval = window.setInterval(() => {
      void loadCalendarData();
    }, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const safeSelectedDay = Math.min(selectedDay, 6);
  const activeDay = weekDays[safeSelectedDay];
  const activeSlots = availability[activeDay?.dateKey] ?? [];

  const toggleSlot = (slot: string) => {
    setAvailability((current) => {
      const daySlots = current[activeDay.dateKey] ?? [];
      const nextSlots = daySlots.includes(slot)
        ? daySlots.filter((value) => value !== slot)
        : [...daySlots, slot].sort();

      void fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: activeDay.dateKey,
          slots: nextSlots,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          setSyncStatus(data?.error || "Failed to save availability");
          return;
        }
        setSyncStatus(`Availability saved for ${activeDay.label} ${activeDay.dayNumber}.`);
      }).catch(() => {
        setSyncStatus("Failed to save availability");
      });

      return {
        ...current,
        [activeDay.dateKey]: nextSlots,
      };
    });
  };

  const updateEventStatus = async (status: "accepted" | "rescheduled" | "cancelled") => {
    if (!selectedEventId) return;
    try {
      const response = await fetch("/api/date-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: selectedEventId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to update invitation");
      setSyncStatus(`Invitation ${status}. Calendar and thread updated.`);
      await loadCalendarData();
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Failed to update invitation");
    }
  };

  const sendCalendarMessage = async () => {
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    const text = calendarMessageDraft.trim();
    if (!selectedEvent?.matchId || !text) return;
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ matchId: selectedEvent.matchId, content: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to send message");
      setCalendarMessageDraft("");
      setSyncStatus("Message sent from Availability Calendar.");
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  const weekSummary = weekDays.map((day) => ({
    day,
    count: (availability[day.dateKey] ?? []).length,
  }));

  const suggestedTimes = weekSummary
    .filter((entry) => entry.count > 0)
    .slice(0, 3)
    .map((entry) => `${entry.day.label} ${entry.day.dayNumber}: ${(availability[entry.day.dateKey] ?? []).slice(0, 2).join(" / ")}`);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
      <section className="rounded-lg border border-teal-200 bg-white/95 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Availability Calendar</h2>
            <p className="mt-1 text-sm text-gray-600">Select your real open windows so Date Planner can propose better meeting times.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase text-teal-800">
            <Clock size={14} />
            Active Planner
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" className="border-teal-200 hover:bg-teal-50" onClick={() => setWeekOffset((value) => value - 1)}>
            Previous Week
          </Button>
          <p className="text-sm font-semibold text-gray-700">Week {weekOffset >= 0 ? `+${weekOffset}` : weekOffset}</p>
          <Button variant="outline" className="border-teal-200 hover:bg-teal-50" onClick={() => setWeekOffset((value) => value + 1)}>
            Next Week
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekDays.map((day, index) => {
            const selected = safeSelectedDay === index;
            const slotCount = (availability[day.dateKey] ?? []).length;
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDay(index)}
                className={`rounded-lg border p-3 text-left transition ${selected ? "border-teal-400 bg-teal-50" : "border-teal-100 bg-white hover:border-teal-300"}`}
              >
                <p className="text-xs font-bold uppercase text-teal-800">{day.label}</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{day.dayNumber}</p>
                <p className="mt-1 text-xs text-gray-600">{slotCount} slots open</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-700">Open windows for {activeDay.label} {activeDay.dayNumber}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {slotOptions.map((slot) => {
              const selected = activeSlots.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${selected ? "border-teal-500 bg-teal-600 text-white" : "border-teal-200 bg-white text-teal-900 hover:bg-teal-50"}`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          {syncStatus ? <p className="mt-3 text-xs font-semibold text-teal-800">{syncStatus}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-white/70 bg-white/90 p-5">
        <h2 className="text-lg font-bold">Real Planner Summary</h2>
        <div className="mt-4 space-y-3">
          {weekSummary.map((entry) => (
            <div key={entry.day.dateKey} className="rounded-lg border border-teal-100 bg-teal-50/70 p-3">
              <p className="text-xs font-bold uppercase text-teal-800">{entry.day.label} {entry.day.dayNumber}</p>
              <p className="mt-1 font-semibold text-gray-900">{entry.count > 0 ? `${entry.count} available slots` : "No availability set"}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-bold uppercase text-indigo-700">Suggested Date Windows</p>
          {suggestedTimes.length > 0 ? (
            <div className="mt-2 space-y-2">
              {suggestedTimes.map((item) => (
                <p key={item} className="text-sm font-semibold text-indigo-900">{item}</p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-indigo-900">Set at least one slot to generate planner suggestions.</p>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase text-sky-700">Invitations and Calendar Events</p>
            <Button variant="outline" className="border-sky-200 hover:bg-sky-100" onClick={() => void loadCalendarData()}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-sm text-sky-900">No invitations yet.</p>
            ) : (
              events.slice(0, 8).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className={`w-full rounded-lg border p-2 text-left ${selectedEventId === event.id ? "border-sky-400 bg-white" : "border-sky-100 bg-white/80"}`}
                >
                  <p className="text-xs font-bold uppercase text-sky-700">{event.status}</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date(event.scheduledAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{event.placeName} • {event.matchId}</p>
                </button>
              ))
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" className="border-sky-200 hover:bg-sky-100" disabled={!selectedEventId} onClick={() => void updateEventStatus("accepted")}>Confirm</Button>
            <Button variant="outline" className="border-sky-200 hover:bg-sky-100" disabled={!selectedEventId} onClick={() => void updateEventStatus("rescheduled")}>Reschedule</Button>
            <Button variant="outline" className="border-rose-200 hover:bg-rose-50" disabled={!selectedEventId} onClick={() => void updateEventStatus("cancelled")}>Cancel</Button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={calendarMessageDraft}
              onChange={(event) => setCalendarMessageDraft(event.target.value)}
              className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm"
              placeholder="Send message about selected invitation"
            />
            <Button className="bg-sky-700 hover:bg-sky-800" disabled={!selectedEventId} onClick={sendCalendarMessage}>
              Message
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function IdentityVerificationPanel() {
  const [documentType, setDocumentType] = useState("Government ID");
  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [selfieStatus, setSelfieStatus] = useState("Ready to capture");
  const [addressStatus, setAddressStatus] = useState("Not submitted");
  const [reviewStatus, setReviewStatus] = useState("Not started");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const submitVerification = async () => {
    try {
      const response = await fetch("/api/safety/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ documentType, legalName, dateOfBirth, country }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to submit verification");
      setSelfieStatus(data.verification.selfieStatus);
      setAddressStatus(data.verification.addressStatus);
      setReviewStatus(data.verification.reviewStatus);
      setVerificationMessage("Verification submitted for review.");
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : "Failed to submit verification");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-5">
      <section className="rounded-lg border border-rose-200 bg-white/95 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Photo Verification</h2>
            <p className="mt-1 text-sm text-gray-600">Verify identity before trust badges and higher safety access are granted.</p>
          </div>
          <UserCheck size={22} className="text-rose-700" />
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-gray-700">
            Document type
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm"
            >
              <option>Government ID</option>
              <option>Passport</option>
              <option>Driver license</option>
              <option>Residence permit</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Legal name
            <input value={legalName} onChange={(event) => setLegalName(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm" placeholder="Name on ID" />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Date of birth
            <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Country
            <input value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm" placeholder="Country of document" />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={submitVerification} className="bg-rose-700 hover:bg-rose-800">
            <Shield size={16} className="mr-2" />
            Submit Verification
          </Button>
          <Button variant="outline" className="border-rose-200 hover:bg-rose-50" onClick={() => setSelfieStatus("Selfie capture requested")}>
            Capture Selfie
          </Button>
          {verificationMessage ? <p className="text-sm font-semibold text-rose-800">{verificationMessage}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-rose-200 bg-rose-50/70 p-5">
        <h2 className="text-lg font-bold">Verification Status</h2>
        <div className="mt-4 space-y-3">
          {[
            ["Document", documentType],
            ["Selfie check", selfieStatus],
            ["Address proof", addressStatus],
            ["Review", reviewStatus],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white p-3">
              <p className="text-xs font-bold uppercase text-rose-700">{label}</p>
              <p className="mt-1 font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportBlockPanel() {
  const [member, setMember] = useState("Amara");
  const [blockReason, setBlockReason] = useState("Unwanted communication");
  const [blockMessages, setBlockMessages] = useState(true);
  const [blockCalls, setBlockCalls] = useState(true);
  const [blockProfileViews, setBlockProfileViews] = useState(false);
  const [blockedMembers, setBlockedMembers] = useState<Array<{ id: string; label: string }>>([
    { id: "seed", label: "Jordan - blocked messages" },
  ]);
  const [status, setStatus] = useState<string | null>(null);

  const blockMember = async () => {
    const scopes = [
      blockMessages ? "messages" : null,
      blockCalls ? "calls" : null,
      blockProfileViews ? "profile views" : null,
    ].filter(Boolean) as string[];

    try {
      const response = await fetch("/api/safety/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberName: member, reason: blockReason, scopes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to block member");
      setBlockedMembers((current) => [
        {
          id: data.blockedMember.id,
          label: `${member} - blocked ${scopes.join(", ") || "communication"}`,
        },
        ...current,
      ]);
      setStatus(`${member} can no longer communicate with you through selected channels.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to block member");
    }
  };

  const unblockMember = async (id: string) => {
    if (id !== "seed") {
      await fetch(`/api/safety/blocks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
    }
    setBlockedMembers((current) => current.filter((blocked) => blocked.id !== id));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-5">
      <section className="rounded-lg border border-rose-200 bg-white/95 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Block Communication</h2>
            <p className="mt-1 text-sm text-gray-600">Stop selected members from messaging, calling, or viewing your profile.</p>
          </div>
          <Ban size={22} className="text-rose-700" />
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-gray-700">
            Member
            <select value={member} onChange={(event) => setMember(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm">
              <option>Amara</option>
              <option>Chanelle</option>
              <option>Jordan</option>
              <option>Marcus</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Reason
            <select value={blockReason} onChange={(event) => setBlockReason(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm">
              <option>Unwanted communication</option>
              <option>Harassment</option>
              <option>Suspicious behavior</option>
              <option>Fake profile concern</option>
              <option>Other safety concern</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["Messages", blockMessages, setBlockMessages],
            ["Calls", blockCalls, setBlockCalls],
            ["Profile views", blockProfileViews, setBlockProfileViews],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/70 p-3 text-sm font-semibold">
              {label as string}
              <input type="checkbox" checked={value as boolean} onChange={(event) => (setter as (next: boolean) => void)(event.target.checked)} />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={blockMember} className="bg-rose-700 hover:bg-rose-800">
            <Ban size={16} className="mr-2" />
            Block Member
          </Button>
          {status ? <p className="text-sm font-semibold text-rose-800">{status}</p> : null}
        </div>
        <p className="mt-3 text-xs text-gray-500">Reason recorded: {blockReason}. Severe reports should be escalated to moderation.</p>
      </section>

      <section className="rounded-lg border border-rose-200 bg-rose-50/70 p-5">
        <h2 className="text-lg font-bold">Blocked Members</h2>
        <div className="mt-4 space-y-3">
          {blockedMembers.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <Button variant="outline" className="border-rose-200 hover:bg-rose-50" onClick={() => unblockMember(item.id)}>
                Unblock
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PrivacyControlsPanel() {
  const [visibility, setVisibility] = useState("Verified members only");
  const [messages, setMessages] = useState("Matches only");
  const [locationSharing, setLocationSharing] = useState("Approximate city");
  const [dataSharing, setDataSharing] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [screenshotAlerts, setScreenshotAlerts] = useState(true);
  const [privacyStatus, setPrivacyStatus] = useState<string | null>(null);

  const savePrivacy = async () => {
    try {
      const response = await fetch("/api/safety/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          visibility,
          messages,
          locationSharing,
          dataSharing,
          readReceipts,
          screenshotAlerts,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save privacy settings");
      setPrivacyStatus("Privacy controls saved.");
    } catch (error) {
      setPrivacyStatus(error instanceof Error ? error.message : "Failed to save privacy settings");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-rose-200 bg-white/95 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Privacy Controls</h2>
            <p className="mt-1 text-sm text-gray-600">Centralized safety settings for visibility, communications, location, and data preferences.</p>
          </div>
          <Lock size={22} className="text-rose-700" />
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm font-semibold text-gray-700">
            Profile visibility
            <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm">
              <option>Everyone</option>
              <option>Verified members only</option>
              <option>Matches only</option>
              <option>Hidden mode</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Communication
            <select value={messages} onChange={(event) => setMessages(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm">
              <option>Everyone</option>
              <option>Verified members only</option>
              <option>Matches only</option>
              <option>No new messages</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Location sharing
            <select value={locationSharing} onChange={(event) => setLocationSharing(event.target.value)} className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm">
              <option>Exact location off</option>
              <option>Approximate city</option>
              <option>Travel mode only</option>
              <option>Hidden</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["Data sharing", dataSharing, setDataSharing],
            ["Read receipts", readReceipts, setReadReceipts],
            ["Screenshot alerts", screenshotAlerts, setScreenshotAlerts],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/70 p-3 text-sm font-semibold">
              {label as string}
              <input type="checkbox" checked={value as boolean} onChange={(event) => (setter as (next: boolean) => void)(event.target.checked)} />
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={savePrivacy} className="bg-rose-700 hover:bg-rose-800">
            <Lock size={16} className="mr-2" />
            Save Privacy Controls
          </Button>
          {privacyStatus ? <p className="text-sm font-semibold text-rose-800">{privacyStatus}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-rose-200 bg-rose-50/70 p-5">
        <h2 className="text-lg font-bold">Control Summary</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["Visibility", visibility],
            ["Communication", messages],
            ["Location", locationSharing],
            ["Data sharing", dataSharing ? "Enabled" : "Disabled"],
            ["Read receipts", readReceipts ? "Enabled" : "Disabled"],
            ["Screenshot alerts", screenshotAlerts ? "Enabled" : "Disabled"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white p-3">
              <p className="text-xs font-bold uppercase text-rose-700">{label}</p>
              <p className="mt-1 font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureExperience({
  group,
  slug,
  feature,
  theme,
}: {
  group: FeatureGroup;
  slug: string;
  feature: { title: string; summary: string; kpis: string[] };
  theme: { cardClass: string; panelClass: string };
}) {
  const workspace = WORKSPACE_COPY[slug];
  const cards = workspace?.cards ?? [];
  const { getCurrentTier, hasAccess } = useRevenueCatEntitlements();
  const currentTier = getCurrentTier();

  if (group === "connections") {
    return (
      <div className="space-y-5">
        <StatStrip feature={feature} theme={theme} />
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
          <section className={`rounded-lg border p-5 ${theme.panelClass}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Connection Pipeline</h2>
              <Users size={20} className="text-rose-600" />
            </div>
            <div className="mt-5 space-y-4">
              {["Viewed profile", "Liked back", "Added favorite", "Ready to message"].map((step, index) => (
                <div key={step} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    {index + 1}
                  </div>
                  <div className="h-3 rounded-full bg-white">
                    <div className="h-3 rounded-full bg-rose-400" style={{ width: `${88 - index * 14}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-white/70 bg-white/90 p-5">
            <h2 className="text-lg font-bold">Priority Profiles</h2>
            <div className="mt-4 space-y-3">
              {cards.map((card, index) => (
                <div key={card.title} className="flex items-start gap-3 rounded-lg border border-rose-100 bg-rose-50/70 p-3">
                  <Star size={17} className="mt-0.5 text-rose-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{card.title}</p>
                    <p className="text-sm text-gray-600">{card.text}</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-rose-700">{92 - index * 7}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (group === "communication") {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-5">
        <aside className={`rounded-lg border p-5 ${theme.panelClass}`}>
          <h2 className="text-lg font-bold">Communication Console</h2>
          <div className="mt-4 space-y-3">
            {cards.map((card) => (
              <div key={card.title} className="rounded-lg border border-sky-200 bg-sky-50/75 p-3">
                <p className="font-semibold text-gray-900">{card.title}</p>
                <p className="mt-1 text-sm text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </aside>
        <CommunicationActivityPanel slug={slug} />
      </div>
    );
  }

  if (group === "discovery") {
    return (
      <div className="space-y-5">
        {slug === "nearby-singles" || slug === "events-meetups" ? (
          <DiscoveryMapPanel slug={slug} />
        ) : (
          <section className={`rounded-lg border p-5 ${theme.panelClass}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Smart Match Map</h2>
              <WandSparkles size={20} className="text-emerald-700" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {cards.map((card) => (
                <span key={card.title} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                  {card.title}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">{workspace?.title ?? "Local matching"} changes the discovery controls for this page.</p>
          </section>
        )}
        {slug === "nearby-singles" ? <GeoMatchingPanel /> : null}
      </div>
    );
  }

  if (group === "dating-tools") {
    if (slug === "date-planner") {
      return <DatePlannerRequestPanel />;
    }

    if (slug === "availability-calendar") {
      return <AvailabilityCalendarPanel />;
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5">
        <section className={`rounded-lg border p-5 ${theme.panelClass}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{workspace?.title ?? "Dating Tools"}</h2>
            <Calendar size={20} className="text-teal-700" />
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-600">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: 21 }).map((_, index) => (
              <div key={index} className={`min-h-16 rounded-lg border p-2 text-xs ${index % 5 === 0 ? "border-teal-300 bg-teal-100" : "border-teal-100 bg-white"}`}>
                {index % 5 === 0 ? "Open" : ""}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-white/70 bg-white/90 p-5">
          <h2 className="text-lg font-bold">Planning Checklist</h2>
          <div className="mt-4 space-y-3">
            {cards.map((card) => (
              <div key={card.title} className="flex gap-3 rounded-lg border border-teal-100 bg-teal-50/70 p-3">
                <CheckCircle2 size={18} className="mt-0.5 text-teal-700" />
                <div>
                  <p className="font-semibold text-gray-900">{card.title}</p>
                  <p className="text-sm text-gray-600">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (group === "premium") {
    const isPremiumActive = hasAccess("premium");
    const isEliteActive = hasAccess("elite");

    return (
      <div className="space-y-5">
        <section className={`rounded-lg border p-5 ${theme.panelClass}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Premium Activation Status</h2>
              <p className="mt-1 text-sm text-gray-600">Live entitlement checks are connected to subscription state.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase text-amber-800">
              <Crown size={14} />
              {currentTier.toUpperCase()} plan
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-amber-200 bg-white p-4">
              <p className="text-xs font-bold uppercase text-amber-700">Premium Access</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{isPremiumActive ? "Active" : "Inactive"}</p>
              <p className="mt-1 text-sm text-gray-600">Boost Profile, Date Planner, Availability Calendar, and premium chat controls.</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-white p-4">
              <p className="text-xs font-bold uppercase text-amber-700">Elite Access</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{isEliteActive ? "Active" : "Inactive"}</p>
              <p className="mt-1 text-sm text-gray-600">Elite-only controls including advanced video session capabilities.</p>
            </div>
          </div>

          {!isPremiumActive ? (
            <Link href="/dashboard/subscription" className="mt-4 inline-flex">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Crown size={16} className="mr-2" />
                Activate Premium
              </Button>
            </Link>
          ) : null}
        </section>

        <section className="rounded-lg border border-white/70 bg-white/90 p-5">
          <h2 className="text-lg font-bold">Premium Feature Modules</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {cards.map((card) => (
              <div key={card.title} className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
                <p className="font-semibold text-gray-900">{card.title}</p>
                <p className="mt-1 text-sm text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (group === "safety") {
    if (slug === "identity-verification") {
      return <IdentityVerificationPanel />;
    }

    if (slug === "report-block") {
      return <ReportBlockPanel />;
    }

    if (slug === "privacy-controls") {
      return <PrivacyControlsPanel />;
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">
        <section className={`rounded-lg border p-5 ${theme.panelClass}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Safety Actions</h2>
            <Shield size={20} className="text-rose-700" />
          </div>
          <div className="mt-4 space-y-3">
            {cards.map((card) => (
              <div key={card.title} className="rounded-lg border border-rose-200 bg-white p-3">
                <p className="font-semibold text-gray-900">{card.title}</p>
                <p className="mt-1 text-sm text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-rose-200 bg-rose-50/70 p-5">
          <h2 className="text-lg font-bold">Privacy And Risk Status</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: Lock, label: "Visibility", value: "Private" },
              { icon: Eye, label: "Review", value: "Active" },
              { icon: Clock, label: "SLA", value: "24h" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white p-4">
                <item.icon size={18} className="text-rose-700" />
                <p className="mt-3 text-sm text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StatStrip feature={feature} theme={theme} />
      <section className={`rounded-lg border p-5 ${theme.panelClass}`}>
        <h2 className="text-lg font-bold">{workspace?.title ?? `${feature.title} Workspace`}</h2>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-lg border border-white/70 bg-white/90 p-3">
              <p className="font-semibold text-gray-900">{card.title}</p>
              <p className="mt-1 text-sm text-gray-600">{card.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdvancedFeaturePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "advanced-feature";
  const group = resolveGroup(slug);
  const theme = GROUP_THEME[group];
  const feature = FEATURE_COPY[slug] ?? {
    title: humanizeSlug(slug),
    summary: "Advanced module scaffold ready for implementation.",
    kpis: ["Metric A", "Metric B", "Metric C"],
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.background} text-gray-900`}>
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer user={{ name: "You" }} />
        <EnterpriseSidebar user={{ name: "You" }} />

        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${theme.cardClass}`}>
                  <GroupBadge group={group} />
                  {formatGroupLabel(group)}
                </div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Sparkles size={24} className={theme.iconClass} />
                  {feature.title}
                </h1>
                <p className="text-gray-600 mt-2">{feature.summary}</p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className={theme.buttonClass}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <FeatureExperience group={group} slug={slug} feature={feature} theme={theme} />

          </div>
        </main>
      </div>
    </div>
  );
}
