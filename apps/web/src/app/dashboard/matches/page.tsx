"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  MoreHorizontal,
  Send,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/stores/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRevenueCatEntitlements } from "@/hooks/useRevenueCatEntitlements";
import { api } from "@/lib/api";
import { EnterpriseSidebar } from "@/components/dashboard/EnterpriseSidebar";
import { MobileEnterpriseDrawer } from "@/components/dashboard/MobileEnterpriseDrawer";
import { ReportModal, type SafetyReport } from "@/components/video-date/ReportModal";

const LADY_IMAGES = [
  '0c7635a9-7e11-482f-836f-8b80072abb9f.jpeg', '1184964461296391037.jpeg', '123_1.jpeg', '167f0183-df8d-4147-b797-db909a5b987e.jpeg', '3d1d2ff8-783a-42fc-8bd7-cd31805ffebe.jpeg',
  '690a83c0-4018-4e40-ba0d-bf5882168c9b.jpeg', 'Attachment_1.jpeg', 'Attachment_2.jpeg', 'Attachment_3.jpeg', 'bafc76b0-afdd-4c5e-8be5-d9808753548a.jpeg',
  'c22dc0a4-4b0a-4b0c-98f2-eaf1d0ae7b7e(1).jpeg', 'c22dc0a4-4b0a-4b0c-98f2-eaf1d0ae7b7e.jpeg', 'Channelle WillSmith.jpeg', 'ef1bf5df-7964-433a-881c-6c1101fab942.jpeg', 'Empress.jpeg',
  'Faith Anderson.jpeg', 'faith_anderson.jpeg', 'Gigi.jpeg', 'gigi2.jpeg', 'IMG_20231011_090239_01.jpeg',
  'IMG_2659.jpeg', 'IMG_2803.jpeg', 'IMG_2808.jpeg', 'IMG_3317.jpeg', 'IMG_3431.jpeg',
  'IMG_4762.jpeg', 'IMG_4804.jpeg', 'IMG_4805.jpeg', 'IMG_4806.jpeg', 'IMG_4825(1).jpeg',
  'IMG_4825.jpeg', 'IMG_4955.jpeg', 'IMG_5467(1).jpeg', 'IMG_5467.jpeg', 'IMG_5697.jpeg',
  'IMG_5790.jpeg', 'IMG_5791(1).jpeg', 'IMG_5791.jpeg', 'IMG_5809(1).jpeg', 'IMG_5809.jpeg',
  'IMG_5810.jpeg', 'IMG_5820(1).jpeg', 'IMG_5820.jpeg', 'IMG_5821(1).jpeg', 'IMG_5821.jpeg',
  'IMG_5822(1).jpeg', 'IMG_5822.jpeg', 'IMG_5823(1).jpeg', 'IMG_5823.jpeg', 'IMG_5824(1).jpeg',
  'IMG_5824(2).jpeg', 'IMG_5824.jpeg', 'IMG_5825(1).jpeg', 'IMG_5825(2).jpeg', 'IMG_5825.jpeg',
  'IMG_5827(1).jpeg', 'IMG_5827(2).jpeg', 'IMG_5827.jpeg', 'IMG_5828(1).jpeg', 'IMG_5828(2).jpeg',
  'IMG_5828.jpeg', 'IMG_5830(1).jpeg', 'IMG_5830.jpeg', 'IMG_5833(1).jpeg', 'IMG_5833(2).jpeg',
  'IMG_5833.jpeg', 'IMG_5836(1).jpeg', 'IMG_5836(2).jpeg', 'IMG_5836.jpeg', 'IMG_5837(1).jpeg',
  'IMG_5837.jpeg', 'IMG_5838(1).jpeg', 'IMG_5838.jpeg', 'IMG_5839(1).jpeg', 'IMG_5839.jpeg',
  'IMG_5840.jpeg', 'IMG_5841(1).jpeg', 'IMG_5841.jpeg', 'IMG_5842(1).jpeg', 'IMG_5842.jpeg',
  'IMG_5843(1).jpeg', 'IMG_5843.jpeg', 'IMG_5844(1).jpeg', 'IMG_5844.jpeg', 'IMG_5845.jpeg',
  'IMG_5846(1).jpeg', 'IMG_5846.jpeg', 'IMG_5848(1).jpeg', 'IMG_5848(2).jpeg', 'IMG_5848.jpeg',
  'IMG_5849.jpeg', 'Maria_uk.jpeg', 'Yvette.jpeg'
];

// Note: This will be replaced dynamically by fetched loggedInUser in the component

const interestsOptions = [
  "Travel",
  "Hiking / Outdoor Adventures",
  "Fitness / Gym",
  "Movies / Streaming",
  "Music / Concerts",
  "Foodie / Cooking",
  "Reading / Books",
  "Gaming",
  "Art / Painting",
  "Dancing",
  "Pets / Dogs / Cats",
  "Coffee / Wine",
  "Spirituality / Mindfulness",
  "Tech / Gadgets",
  "Photography",
  "Volunteering / Charity",
  "Sports",
  "Nightlife / Partying",
  "Family-oriented",
  "Career-driven",
];

const skillsOptions = [
  "Cooking / Baking",
  "Photography",
  "Graphic Design",
  "Video Editing",
  "Programming / Coding",
  "Languages",
  "Music",
  "Public Speaking",
  "Writing / Blogging",
  "Fitness Training",
  "DIY / Handyman",
  "Gardening",
  "Driving",
  "Finance / Investing",
  "Teaching / Tutoring",
  "Leadership / Management",
  "Event Planning",
  "Martial Arts / Self-defense",
];

export default function MatchesPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useRequireAuth("/dashboard/matches");
  const { refresh } = useAuth();
  const { getCurrentTier } = useRevenueCatEntitlements();
  const [loggedInUser, setLoggedInUser] = useState({ name: "", avatar: "" });
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [recommendationOn, setRecommendationOn] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatList, setChatList] = useState<Array<{ id: number; matchId?: string; name: string; avatar: string; lastMessage: string; time: string; online: boolean; unreadCount?: number }>>([]);
  const [chatMessages, setChatMessages] = useState<Record<number, { id: string; text: string; time: string }[]>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterHeightMin, setFilterHeightMin] = useState("");
  const [filterHeightMax, setFilterHeightMax] = useState("");
  const [filterEducation, setFilterEducation] = useState("");
  const [filterLifestyle, setFilterLifestyle] = useState("");
  const [connectRequests, setConnectRequests] = useState<number[]>([]);
  const [selectedMoreOptions, setSelectedMoreOptions] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [showExpandedChat, setShowExpandedChat] = useState(false);
  const [expandedChatUser, setExpandedChatUser] = useState<any>(null);
  const [matchCardsData, setMatchCardsData] = useState<Array<{ id: number; matchId?: string; otherUserId?: string; name: string; score: string; avatar: string; online: boolean; age?: number; location?: string; bio?: string }>>([]);
  const [notificationsData, setNotificationsData] = useState<Array<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string }>>([]);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const actionTimer = useRef<number | null>(null);

  const tier = getCurrentTier();
  const canChat = tier === "premium" || tier === "elite";
  const tokenOrRefresh = async () => accessToken ?? (await refresh());

  const toClock = (iso?: string) => {
    if (!iso) return "00";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "00";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const toDisplayScore = (index: number) => `${Math.max(55, 100 - index * 4)}%`;

  const loadThreadForChat = async (chatId: number, markRead = false) => {
    if (!canChat) return;
    const chat = chatList.find((item) => item.id === chatId);
    if (!chat?.matchId) return;

    try {
      const token = await tokenOrRefresh();
      if (!token) return;

      const msgs = await api.get<Array<{ id: string; content: string; createdAt: string }>>(
        `/messages?matchId=${encodeURIComponent(chat.matchId)}`,
        token
      );

      setChatMessages((prev) => ({
        ...prev,
        [chatId]: (msgs || []).map((msg) => ({
          id: msg.id,
          text: msg.content,
          time: toClock(msg.createdAt),
        })),
      }));

      if (markRead) {
        await api.post("/messages/read", { matchId: chat.matchId }, token);
      }
    } catch (error: any) {
      if (error?.status === 403) {
        showAction("Chat requires Premium or Elite.");
      } else {
        showAction("Failed to load chat thread.");
      }
    }
  };

  const loadMatches = async () => {
    if (!isAuthenticated) return;
    setLoadingMatches(true);
    try {
      const token = await tokenOrRefresh();
      if (!token) return;

      const [userData, matchesData] = await Promise.all([
        api.get<any>("/users/me", token).catch(() => null),
        api.get<Array<any>>("/matches", token),
      ]);

      const userAvatar = `/pic2datebukladies/${LADY_IMAGES[Math.floor(Math.random() * LADY_IMAGES.length)]}`;
      setLoggedInUser({
        name:
          userData?.fullName ||
          userData?.displayName ||
          userData?.profile?.displayName ||
          userData?.email ||
          "User",
        avatar: userData?.photos?.[0] || userData?.profile?.photos?.[0] || userAvatar,
      });

      if (!Array.isArray(matchesData) || matchesData.length === 0) {
        // No fake fallback profiles here — an empty match list is a normal,
        // honest state (e.g. a brand-new user), not an error to paper over.
        setMatchCardsData([]);
        setChatList([]);
        return;
      }

      const mapped = matchesData.map((match, index) => ({
        id: index + 1,
        matchId: match.id,
        otherUserId: match.matchedUserId || match.otherUser?.id,
        name: match.matchedUserName || match.otherUser?.displayName || `Match ${index + 1}`,
        score: toDisplayScore(index),
        avatar: match.otherUser?.avatar || `/pic2datebukladies/${LADY_IMAGES[index % LADY_IMAGES.length]}`,
        online: index % 2 === 0,
        age: match.matchedUserAge,
        location: match.matchedUserLocation,
        bio: match.matchedUserBio,
      }));

      setMatchCardsData(mapped);
      setChatList(
        mapped.map((item) => ({
          id: item.id,
          matchId: item.matchId,
          name: item.name,
          avatar: item.avatar,
          lastMessage: "Tap to chat",
          time: "00",
          online: item.online,
          unreadCount: 0,
        }))
      );
      setActiveChat((prev) => prev ?? (mapped[0]?.id ?? null));
    } catch (error) {
      // Previously fell back to hardcoded fake profiles (with a "110%"
      // match-score typo baked in) on any API failure — a real user would
      // see fabricated matches with no indication they weren't real. Show
      // an honest empty state instead.
      console.error("Failed to load matches:", error);
      showAction("Failed to load matches. Please try again.");
      setMatchCardsData([]);
      setChatList([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const token = await tokenOrRefresh();
      if (!token) return;
      const payload = await api.get<Array<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string }>>(
        "/notifications",
        token
      );
      setNotificationsData(Array.isArray(payload) ? payload : []);
    } catch {
      showAction("Failed to load notifications.");
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const payload = await fetch("/api/settings", { cache: "no-store" }).then((res) => res.json());
      setSettingsData(payload);
    } catch {
      showAction("Failed to load settings.");
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadMatches();
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    if (showNotificationsModal) {
      void loadNotifications();
    }
  }, [showNotificationsModal]);

  useEffect(() => {
    if (showSettingsModal) {
      void loadSettings();
    }
  }, [showSettingsModal]);

  useEffect(() => {
    if (!activeChat) return;
    void loadThreadForChat(activeChat, true);
  }, [activeChat, canChat]);

  const handleConnect = async (matchId: number, matchName: string) => {
    if (connectRequests.includes(matchId)) {
      setConnectRequests((prev) => prev.filter((id) => id !== matchId));
      showAction(`Connect request cancelled with ${matchName}.`);
    } else {
      const selectedMatch = matchCardsData.find((item) => item.id === matchId);
      let matched = false;

      if (selectedMatch?.otherUserId) {
        try {
          const token = await tokenOrRefresh();
          if (!token) return;
          const swipe = await api.post<{ matched?: boolean }>(
            "/swipes",
            { toId: selectedMatch.otherUserId, action: "like" },
            token
          );
          matched = Boolean(swipe?.matched);
        } catch (error: any) {
          if (error?.status === 401) {
            showAction("Session expired. Please sign in again.");
          } else {
            showAction("Failed to send connect request.");
          }
          return;
        }
      }

      setConnectRequests((prev) => [...prev, matchId]);
      showAction(matched ? `It's a match with ${matchName}! ✅` : `Connect request sent to ${matchName}! ✨`);
      setActiveChat(matchId);
      const chatUser = chatList.find((item) => item.id === matchId);
      if (chatUser) {
        setExpandedChatUser(chatUser);
      }
      if (canChat) {
        await loadThreadForChat(matchId, true);
      }
    }
  };

  const handleMoreOptions = (matchId: number, matchName: string) => {
    setSelectedMoreOptions(selectedMoreOptions === matchId ? null : matchId);
  };

  const removeMatchFromView = (matchCardId: number) => {
    setMatchCardsData((prev) => prev.filter((m) => m.id !== matchCardId));
    setChatList((prev) => prev.filter((c) => c.id !== matchCardId));
    setActiveChat((prev) => (prev === matchCardId ? null : prev));
  };

  const handleStartCall = async (match: any, media: "voice" | "video") => {
    if (!match?.matchId || !match?.otherUserId) {
      showAction("Unable to start a call right now.");
      return;
    }
    try {
      const token = await tokenOrRefresh();
      if (!token) return;
      // apps/api verifies the match, the block status, and the tier before minting this
      // token — apps/signaling then requires it to let anyone into the call room, so
      // there's no longer a bare roomId a client can just make up.
      const result = await api.post<{ roomId: string; callToken: string }>(
        "/calls/token",
        { matchId: match.matchId, media },
        token
      );
      router.push(`/video-call/${result.roomId}?callToken=${encodeURIComponent(result.callToken)}&media=${media}`);
    } catch (error: any) {
      showAction(error?.message || "Unable to start the call. Please try again.");
    }
  };

  const handleBlockUser = async (match: any) => {
    setSelectedMoreOptions(null);
    if (!match?.otherUserId) {
      showAction("Unable to block this user right now.");
      return;
    }
    try {
      const token = await tokenOrRefresh();
      if (!token) return;
      await api.post("/safety/block", { userId: match.otherUserId }, token);
      removeMatchFromView(match.id);
      showAction(`${match.name} has been blocked.`);
    } catch {
      showAction("Failed to block user. Please try again.");
    }
  };

  const handleReportUser = (match: any) => {
    setSelectedMoreOptions(null);
    setReportTarget(match);
  };

  const submitReport = async (report: SafetyReport) => {
    const target = reportTarget;
    setReportTarget(null);
    if (!target?.otherUserId) {
      showAction("Unable to report this user right now.");
      return;
    }
    try {
      const token = await tokenOrRefresh();
      if (!token) return;
      // "Report and block" as one action: the modal's "Block this user" checkbox drives
      // whether the report also blocks, matching what the backend does in one call.
      await api.post(
        "/safety/report",
        {
          userId: target.otherUserId,
          category: report.category,
          description: report.description,
          matchId: target.matchId,
          block: report.blockUser,
        },
        token
      );
      if (report.blockUser) removeMatchFromView(target.id);
      showAction(`Report sent for ${target.name}. Thanks for keeping our community safe.`);
    } catch {
      showAction("Failed to submit report. Please try again.");
    }
  };

  const handleViewProfile = (match: any) => {
    setSelectedMoreOptions(null);
    setSelectedProfile(match);
    showAction(`Opening profile for ${match.name}...`);
  };

  const filteredMatches = useMemo(
    () => matchCardsData.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery, matchCardsData]
  );

  const visibleMatches = useMemo(() => {
    if (activeFilter === "Favorites") {
      return filteredMatches.filter((match) => favoriteIds.includes(match.id));
    }
    return filteredMatches;
  }, [activeFilter, favoriteIds, filteredMatches]);

  const showAction = (message: string) => {
    setActionMessage(message);
    if (actionTimer.current) window.clearTimeout(actionTimer.current);
    actionTimer.current = window.setTimeout(() => setActionMessage(null), 2200);
  };

  const handleFilterClick = (tag: string) => {
    setActiveFilter(tag);
    setFilterOpen(true);
    showAction(`${tag} filter opened.`);
  };

  const toggleFavorite = (id: number) => {
    setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleInterest = (value: string) => {
    setSelectedInterests((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const toggleSkill = (value: string) => {
    setSelectedSkills((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const addCustomFilter = () => {
    const parts = [filterKeyword.trim() ? `Keyword: ${filterKeyword.trim()}` : "", filterHeightMin || filterHeightMax ? `Height ${filterHeightMin || "-"}-${filterHeightMax || "-"}` : "", filterEducation, filterLifestyle]
      .filter(Boolean)
      .join(" • ");

    if (!parts) {
      showAction("Add at least one filter value.");
      return;
    }

    setCustomFilters((prev) => [...prev, parts]);
    setFilterKeyword("");
    setFilterHeightMin("");
    setFilterHeightMax("");
    setFilterEducation("");
    setFilterLifestyle("");
    showAction("Filter added.");
  };

  const sendChatMessage = () => {
    if (!activeChat) {
      showAction("Select a chat to send a message.");
      return;
    }
    if (!canChat) {
      showAction("Real-time chat requires Premium or Elite.");
      return;
    }
    if (!chatDraft.trim()) {
      showAction("Type a message first.");
      return;
    }

    const activeChatUser = chatList.find((item) => item.id === activeChat);
    if (!activeChatUser?.matchId) {
      showAction("No chat thread is available for this conversation yet.");
      return;
    }

    const outgoingText = chatDraft.trim();
    setChatDraft("");

    void (async () => {
      try {
        const token = await tokenOrRefresh();
        if (!token) return;
        await api.post(
          "/messages",
          { matchId: activeChatUser.matchId, content: outgoingText },
          token
        );

        await loadThreadForChat(activeChat, false);

        setChatList((prev) =>
          prev.map((user) =>
            user.id === activeChat
              ? {
                  ...user,
                  lastMessage: outgoingText,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                }
              : user
          )
        );

        showAction("Message sent.");
      } catch (error: any) {
        if (error?.status === 403) {
          showAction("Chat requires Premium or Elite.");
        } else if (error?.status === 401) {
          showAction("Session expired. Please sign in again.");
        } else {
          showAction("Failed to send message.");
        }
        setChatDraft(outgoingText);
      }
    })();
  };

  const getProfileScore = (profile: any) => {
    const parsed = Number(profile?.score);
    if (!Number.isFinite(parsed)) return 75;
    return Math.max(0, Math.min(100, parsed));
  };

  const getScoreBarWidthClass = (score: number) => {
    if (score >= 90) return "w-[90%]";
    if (score >= 80) return "w-4/5";
    if (score >= 70) return "w-[70%]";
    if (score >= 60) return "w-3/5";
    if (score >= 50) return "w-1/2";
    if (score >= 40) return "w-2/5";
    if (score >= 30) return "w-[30%]";
    if (score >= 20) return "w-1/5";
    if (score >= 10) return "w-[10%]";
    return "w-[5%]";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-gray-900">
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer user={{ name: loggedInUser.name, avatar: loggedInUser.avatar }} />
        <EnterpriseSidebar user={{ name: loggedInUser.name, avatar: loggedInUser.avatar }} />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {actionMessage ? (
            <div className="absolute right-6 top-6 z-10 rounded-full bg-gray-900 px-4 py-2 text-xs text-gray-100 backdrop-blur-md">
              {actionMessage}
            </div>
          ) : null}
          <header className="p-6 border-b border-pink-200 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Matches</h1>
                <p className="text-sm text-gray-600">Recommendation</p>
                <p className="text-xs text-gray-500">
                  {loadingMatches ? "Loading live matches..." : `Plan: ${tier.toUpperCase()}${canChat ? " • chat enabled" : " • chat locked"}`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Recommendation</span>
                  <Switch checked={recommendationOn} onCheckedChange={setRecommendationOn} />
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-pink-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-pink-50 hover:bg-pink-100"
                    type="button"
                    onClick={() => setShowNotificationsModal(!showNotificationsModal)}
                  >
                    <Bell size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-pink-50 hover:bg-pink-100"
                    type="button"
                    onClick={() => setShowSettingsModal(!showSettingsModal)}
                  >
                    <Settings size={18} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {["Interests", "Skills", "Favorites", "Setting"].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="bg-pink-50 hover:bg-pink-100 cursor-pointer px-4 py-1.5 text-sm border-pink-200 text-gray-900"
                  onClick={() => handleFilterClick(tag)}
                >
                  {tag} <ChevronRight size={14} className="ml-1" />
                </Badge>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="text-pink-600 hover:text-pink-700"
                type="button"
                onClick={() => {
                  setFilterOpen((prev) => !prev);
                  setAddFilterOpen(true);
                  showAction("Add filter opened.");
                }}
              >
                + Add Filter
              </Button>
            </div>

            {filterOpen ? (
              <div className="mt-4 rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{activeFilter || "Filters"}</div>
                  <button
                    type="button"
                    title="Close filters"
                    onClick={() => setFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilter === "Interests" ? (
                    <div className="flex flex-wrap gap-2">
                      {interestsOptions.slice(0, 12).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleInterest(item)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            selectedInterests.includes(item)
                              ? "border-pink-400 bg-pink-200 text-pink-900"
                              : "border-pink-200 bg-white text-gray-700 hover:bg-pink-50"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => showAction("More interests coming soon.")}
                        className="rounded-full border border-pink-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-pink-50"
                      >
                        More...
                      </button>
                    </div>
                  ) : activeFilter === "Skills" ? (
                    <div className="flex flex-wrap gap-2">
                      {skillsOptions.slice(0, 12).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSkill(item)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            selectedSkills.includes(item)
                              ? "border-purple-400 bg-purple-200 text-purple-900"
                              : "border-pink-200 bg-white text-gray-700 hover:bg-pink-50"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => showAction("More skills coming soon.")}
                        className="rounded-full border border-pink-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-pink-50"
                      >
                        More...
                      </button>
                    </div>
                  ) : activeFilter === "Favorites" ? (
                    <>
                      {favoriteIds.length === 0 ? (
                        <div className="rounded-2xl border border-pink-200 bg-pink-50 p-6 text-center text-sm text-gray-600">
                          You haven't favorited anyone yet. Heart profiles you like.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>My Favorites ({favoriteIds.length})</span>
                            <span>Sorted by newest</span>
                          </div>
                          {matchCardsData
                            .filter((match) => favoriteIds.includes(match.id))
                            .map((match) => (
                              <div key={match.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={match.avatar} alt={match.name} />
                                  <AvatarFallback>{match.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-white">{match.name}</div>
                                  <div className="text-xs text-white/50">Match {match.score} • Favorited 2 days ago</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {canChat ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      type="button"
                                      onClick={() => showAction(`Messaging ${match.name}...`)}
                                    >
                                      Message
                                    </Button>
                                  ) : null}
                                  <Button size="sm" variant="ghost" type="button" onClick={() => toggleFavorite(match.id)}>Unfavorite</Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  ) : activeFilter === "Setting" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-xs uppercase text-white/40">Match Preferences</div>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Edit age range.")}>Age range</Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Edit distance.")}>Distance</Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Edit dating intent.")}>Dating intent</Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Edit gender preference.")}>Gender preference</Button>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs uppercase text-white/40">Visibility</div>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Visibility updated.")}>Visibility</Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Notification settings opened.")}>Notifications</Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Privacy options opened.")}>Privacy</Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Subscription settings opened.")}>Subscription</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Filter saved.")}>Save filter</Button>
                      <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Filter applied.")}>Apply filter</Button>
                      <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Filter reset.")}>Reset</Button>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {addFilterOpen ? (
              <div className="mt-4 rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">Add Filter</div>
                  <button
                    type="button"
                    title="Close add filter"
                    onClick={() => setAddFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Keyword (e.g., vegan, doctor)"
                    value={filterKeyword}
                    onChange={(event) => setFilterKeyword(event.target.value)}
                    className="bg-white border-pink-200 text-gray-900 placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Height min"
                      value={filterHeightMin}
                      onChange={(event) => setFilterHeightMin(event.target.value)}
                      className="bg-white border-pink-200 text-gray-900 placeholder:text-gray-400"
                    />
                    <Input
                      placeholder="Height max"
                      value={filterHeightMax}
                      onChange={(event) => setFilterHeightMax(event.target.value)}
                      className="bg-white border-pink-200 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <Input
                    placeholder="Education level"
                    value={filterEducation}
                    onChange={(event) => setFilterEducation(event.target.value)}
                    className="bg-white border-pink-200 text-gray-900 placeholder:text-gray-400"
                  />
                  <Input
                    placeholder="Lifestyle (drinking, smoking, kids)"
                    value={filterLifestyle}
                    onChange={(event) => setFilterLifestyle(event.target.value)}
                    className="bg-white border-pink-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button size="sm" type="button" className="bg-pink-500 hover:bg-pink-600" onClick={addCustomFilter}>
                    Apply filters
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => showAction("Advanced filters saved.")}>Save</Button>
                </div>
                {customFilters.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {customFilters.map((filter, index) => (
                      <span key={filter + index} className="flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs text-gray-900">
                        {filter}
                        <button
                          type="button"
                          title="Remove saved filter"
                          onClick={() => setCustomFilters((prev) => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-gray-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </header>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {visibleMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  whileHover={{ scale: 1.03 }}
                  className={`group relative bg-white backdrop-blur-md border border-pink-200 rounded-2xl overflow-hidden hover:border-pink-500 transition-all duration-300 cursor-pointer`}
                  onClick={() => {
                    setActiveChat(match.id);
                    const chatUser = chatList.find((item) => item.id === match.id);
                    if (chatUser) {
                      setExpandedChatUser(chatUser);
                    }
                    showAction(`Opened ${match.name}.`);
                    if (canChat) {
                      void loadThreadForChat(match.id, true);
                    }
                  }}
                >
                  <div className="p-4 flex flex-col items-center text-center">
                    <div className="relative">
                      <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-offset-purple-50 ring-pink-500/50">
                        <AvatarImage src={match.avatar} alt={match.name} />
                        <AvatarFallback>{match.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-purple-50 ${match.online ? "bg-green-500" : "bg-gray-500"}`} />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(match.id);
                        showAction(
                          favoriteIds.includes(match.id)
                            ? `${match.name} removed from favorites.`
                            : `${match.name} added to favorites.`
                        );
                      }}
                    >
                      <Heart
                        size={18}
                        className={favoriteIds.includes(match.id) ? "text-pink-500" : "text-gray-400"}
                        fill={favoriteIds.includes(match.id) ? "currentColor" : "none"}
                      />
                    </Button>

                    <h3 className="mt-4 font-semibold text-lg text-gray-900">{match.name}</h3>

                    <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                      <Star size={14} fill="currentColor" className="text-yellow-400" />
                      <span className={match.score.includes("100") ? "text-green-600 font-medium" : "text-gray-600"}>
                        {match.score}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-pink-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMoreOptions(match.id, match.name);
                      }}
                      title="More options"
                    >
                      <MoreHorizontal size={18} className="text-gray-600" />
                    </Button>

                    {/* More Options Dropdown */}
                    {selectedMoreOptions === match.id && (
                      <div className="absolute top-12 right-0 z-50 bg-white border border-pink-200 rounded-xl shadow-2xl p-2 min-w-[180px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(match);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-pink-50 rounded-lg transition"
                        >
                          📋 View Profile
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleBlockUser(match);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          🚫 Block User
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReportUser(match);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        >
                          ⚠️ Report User
                        </button>
                      </div>
                    )}

                    <Button
                      size="sm"
                      className={`mt-4 w-full transition-all ${
                        connectRequests.includes(match.id)
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleConnect(match.id, match.name);
                      }}
                    >
                      {connectRequests.includes(match.id) ? "✓ Connected" : "Connect"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Settings Modal */}
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">⚙️ Settings</h2>
                  <button
                    title="Close settings"
                    onClick={() => setShowSettingsModal(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="mb-4 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs text-gray-700">
                  {loadingSettings
                    ? "Loading current settings..."
                    : settingsData
                      ? `Realtime: ${settingsData?.realtime?.enabled ? "On" : "Off"} • Push notifications: ${settingsData?.notifications?.push ? "On" : "Off"}`
                      : "Settings unavailable"}
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      void fetch("/api/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ privacy: { profileVisible: true } }),
                      });
                      setShowSettingsModal(false);
                      router.push("/dashboard/advanced/privacy-controls");
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-pink-50 rounded-lg transition border border-pink-200"
                  >
                    🔒 Privacy Settings
                  </button>
                  <button
                    onClick={() => {
                      void fetch("/api/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notifications: { push: true, email: true, messages: true } }),
                      });
                      setShowSettingsModal(false);
                      router.push("/dashboard/notifications");
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-pink-50 rounded-lg transition border border-pink-200"
                  >
                    🔔 Notification Preferences
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      router.push("/dashboard/settings");
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-pink-50 rounded-lg transition border border-pink-200"
                  >
                    👤 Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      router.push("/dashboard/subscription");
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-pink-50 rounded-lg transition border border-pink-200"
                  >
                    💎 Subscription
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Notifications Modal */}
          {showNotificationsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">🔔 Notifications</h2>
                  <button
                    title="Close notifications"
                    onClick={() => setShowNotificationsModal(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {loadingNotifications ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">Loading notifications...</div>
                  ) : notificationsData.length === 0 ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">No notifications yet.</div>
                  ) : (
                    notificationsData.map((item) => (
                      <div key={item.id} className={`p-3 rounded-lg border ${item.read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"}`}>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-gray-700 text-xs mt-1">{item.body}</p>
                        <p className="text-gray-500 text-xs mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600"
                  onClick={async () => {
                    setNotificationsData((prev) => prev.map((item) => ({ ...item, read: true })));
                    const token = await tokenOrRefresh();
                    if (token) {
                      await api.post("/notifications/read-all", {}, token).catch(() => null);
                    }
                    showAction("All notifications marked as read.");
                    setShowNotificationsModal(false);
                  }}
                >
                  Mark All as Read
                </Button>
              </motion.div>
            </div>
          )}

          {/* Profile Modal */}
          {selectedProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">👤 Profile</h2>
                  <button
                    title="Close profile"
                    onClick={() => setSelectedProfile(null)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Profile Image */}
                <div className="mb-4">
                  <img
                    src={selectedProfile.avatar || `/pic2datebukladies/${LADY_IMAGES[selectedProfile.id % LADY_IMAGES.length]}`}
                    alt={selectedProfile.name}
                    className="w-full h-64 object-cover rounded-xl border border-pink-200"
                  />
                </div>

                {/* Profile Info */}
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{selectedProfile.name}</p>
                    <p className="text-sm text-gray-600">{selectedProfile.age || 25} years old</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full ${getScoreBarWidthClass(getProfileScore(selectedProfile))}`}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{getProfileScore(selectedProfile)}%</span>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 font-semibold">📍 Location</p>
                    <p className="text-gray-700">{selectedProfile.location || "New York, NY"}</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">💫 Interests</p>
                    <p className="text-gray-700 text-sm">{selectedProfile.interests || "Travel, Fitness, Music, Cooking"}</p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-semibold">📝 Bio</p>
                    <p className="text-gray-700 text-sm">{selectedProfile.bio || "Adventure seeker, animal lover, and coffee enthusiast. Let's grab a coffee and see where it goes!"}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    onClick={() => {
                      setSelectedProfile(null);
                      handleConnect(selectedProfile.id, selectedProfile.name);
                      showAction(`Connected with ${selectedProfile.name}!`);
                    }}
                  >
                    💬 Connect
                  </Button>
                  {canChat ? (
                    <Button
                      className="w-full bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() => {
                        setMessageRecipient(selectedProfile);
                        setMessageText("");
                        setShowMessageModal(true);
                      }}
                    >
                      ✉️ Send Message
                    </Button>
                  ) : null}
                  {canChat ? (
                    <Button
                      className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
                      onClick={() => {
                        const profile = selectedProfile;
                        setSelectedProfile(null);
                        void handleStartCall(profile, "voice");
                      }}
                    >
                      📞 Start Voice Call
                    </Button>
                  ) : null}
                  {tier === "elite" ? (
                    <Button
                      className="w-full bg-purple-600 text-white hover:bg-purple-700"
                      onClick={() => {
                        const profile = selectedProfile;
                        setSelectedProfile(null);
                        void handleStartCall(profile, "video");
                      }}
                    >
                      🎥 Start Video Call
                    </Button>
                  ) : null}
                  <Button
                    className="w-full bg-red-500 text-white hover:bg-red-600"
                    onClick={() => {
                      const profile = selectedProfile;
                      setSelectedProfile(null);
                      void handleBlockUser(profile);
                    }}
                  >
                    🚫 Block
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Send Message Modal */}
          {showMessageModal && messageRecipient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={messageRecipient.avatar || `/pic2datebukladies/${LADY_IMAGES[messageRecipient.id % LADY_IMAGES.length]}`}
                      alt={messageRecipient.name}
                      className="w-10 h-10 rounded-full object-cover border border-pink-200"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Send Message</h2>
                      <p className="text-xs text-gray-500">To: {messageRecipient.name}</p>
                    </div>
                  </div>
                  <button
                    title="Close message composer"
                    onClick={() => {
                      setShowMessageModal(false);
                      setMessageRecipient(null);
                      setMessageText("");
                    }}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Message Input Area */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here... Share something interesting about yourself!"
                      className="w-full h-32 bg-transparent focus:outline-none text-sm text-gray-900 placeholder-gray-400 resize-none"
                    />
                  </div>

                  {/* Character Count */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Message preview</span>
                    <span>{messageText.length}/500</span>
                  </div>

                  {/* Message Preview */}
                  {messageText && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Preview:</p>
                      <p className="text-sm text-gray-700">{messageText}</p>
                    </div>
                  )}

                  {/* Send Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition"
                    onClick={() => {
                      if (!canChat) {
                        showAction("Chat requires Premium or Elite.");
                        return;
                      }
                      if (messageText.trim()) {
                        showAction(`Message sent to ${messageRecipient.name}! 💌`);
                        setShowMessageModal(false);
                        setMessageRecipient(null);
                        setMessageText("");
                      } else {
                        showAction("Please type a message first!");
                      }
                    }}
                    disabled={!canChat || !messageText.trim()}
                  >
                    📤 Send Message
                  </Button>

                  {/* Cancel Button */}
                  <Button
                    className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                    onClick={() => {
                      setShowMessageModal(false);
                      setMessageRecipient(null);
                      setMessageText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Tips */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                  <p>💡 <span className="font-semibold">Tips:</span></p>
                  <p>• Be respectful and genuine</p>
                  <p>• Mention something specific about their profile</p>
                  <p>• Ask an open-ended question to get a response</p>
                </div>
              </motion.div>
            </div>
          )}
        </main>

        {/* Right Chat Panel */}
        {canChat ? (
        <aside className="hidden w-96 flex-col border-l border-pink-200 bg-white/80 backdrop-blur-xl lg:flex">
          <div className="p-5 border-b border-pink-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={loggedInUser.avatar} alt={loggedInUser.name} />
                <AvatarFallback>{loggedInUser.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">Real-Time Chat</p>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-pink-50 hover:bg-pink-100"
                onClick={() => setShowNotificationsModal(true)}
              >
                <Bell size={16} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-pink-50 hover:bg-pink-100"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings size={16} />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                placeholder="Search conversations..." 
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="pl-10 bg-pink-50 border-pink-200 text-gray-900 placeholder:text-gray-400 focus:border-pink-400 transition" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            {chatList
              .filter((user) => user.name.toLowerCase().includes(chatSearchQuery.toLowerCase()))
              .map((user) => (
              <button
                type="button"
                key={user.id}
                onClick={() => {
                  setActiveChat(user.id);
                  setExpandedChatUser(user);
                  setShowExpandedChat(true);
                  showAction(`Opened chat with ${user.name}.`);
                  if (canChat) {
                    void loadThreadForChat(user.id, true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition ${
                  activeChat === user.id ? "bg-pink-100" : "hover:bg-pink-50"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${user.online ? "bg-green-500" : "bg-gray-500"}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.lastMessage}</p>
                </div>
                <div className="text-xs text-gray-400">{user.time}</div>
              </button>
            ))}
            {chatList.filter((user) => user.name.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 && (
              <div className="flex items-center justify-center h-32 text-center">
                <div className="text-gray-400">
                  <p className="text-sm font-medium">No conversations found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages Display Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-pink-50">
            {activeChat && chatMessages[activeChat] && chatMessages[activeChat].length > 0 ? (
              chatMessages[activeChat].map((msg) => (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[70%] bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl rounded-tr-none px-4 py-2 shadow-sm">
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-white/70 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm text-center">
                  {activeChat ? "No messages yet. Start a conversation! 💬" : "Select a chat to start messaging"}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-pink-200">
            {canChat ? (
              <div className="relative">
                <Input
                  placeholder="Type a message..."
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendChatMessage();
                  }}
                  className="pr-12 bg-pink-50 border-pink-200 text-gray-900 placeholder:text-gray-400"
                />
                <Button
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 hover:bg-pink-600"
                  type="button"
                  onClick={sendChatMessage}
                >
                  <Send size={16} />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-amber-700 text-center">Upgrade to Premium to unlock real-time chat.</p>
            )}
          </div>

          {/* Expanded Chat Modal */}
          {showExpandedChat && expandedChatUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-screen sm:w-[600px] h-[90vh] sm:h-[700px] rounded-2xl bg-white border border-pink-200 shadow-2xl overflow-hidden flex flex-col"
              >
                {/* Chat Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 border-b border-pink-300">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white">
                      <AvatarImage src={expandedChatUser.avatar} alt={expandedChatUser.name} />
                      <AvatarFallback>{expandedChatUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-bold">{expandedChatUser.name}</h2>
                      <p className="text-xs text-white/70 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${expandedChatUser.online ? "bg-green-300" : "bg-gray-400"}`} />
                        {expandedChatUser.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  <button
                    title="Close expanded chat"
                    onClick={() => {
                      setShowExpandedChat(false);
                      setExpandedChatUser(null);
                    }}
                    className="text-white hover:text-white/80 transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white via-pink-50 to-purple-50">
                  {activeChat && chatMessages[activeChat] && chatMessages[activeChat].length > 0 ? (
                    <>
                      {/* Sample incoming message */}
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-white border border-pink-200 text-gray-900 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                          <p className="text-sm">Hey! 👋 How's your day going?</p>
                          <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
                        </div>
                      </div>

                      {/* User messages */}
                      {chatMessages[activeChat].map((msg) => (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[70%] bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl rounded-tr-none px-4 py-2 shadow-sm">
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs text-white/70 mt-1">{msg.time}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <MessageCircle size={48} className="mx-auto opacity-30 mb-4" />
                        <p className="text-sm">Start a conversation! 💬</p>
                        <p className="text-xs text-gray-500 mt-2">Send a message to {expandedChatUser.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input Area */}
                <div className="p-4 border-t border-pink-200 bg-white">
                  {canChat ? (
                    <>
                      <div className="relative flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={chatDraft}
                          onChange={(event) => setChatDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              sendChatMessage();
                            }
                          }}
                          className="flex-1 bg-pink-50 border-pink-200 text-gray-900 placeholder:text-gray-400 rounded-full"
                        />
                        <Button
                          size="icon"
                          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg transition rounded-full"
                          type="button"
                          onClick={sendChatMessage}
                        >
                          <Send size={18} className="text-white" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Press Enter to send or click the button</p>
                    </>
                  ) : (
                    <p className="text-xs text-amber-700 text-center">Upgrade to Premium to unlock real-time chat.</p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </aside>
        ) : null}
      </div>
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
        recipientName={reportTarget?.name || ""}
      />
    </div>
  );
}
