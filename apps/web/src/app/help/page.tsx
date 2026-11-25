"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const helpCategories = [
  {
    id: "getting-started",
    title: "🚀 Getting Started",
    items: [
      {
        question: "How do I create a profile?",
        answer: "To create a profile, sign up with your email or phone number. Then fill in your basic information, add photos, and tell us about your interests. You'll be ready to start matching in minutes!",
      },
      {
        question: "How do I add photos to my profile?",
        answer: "Go to Settings > Profile > Photos. You can upload up to 6 photos. Make sure they're clear, well-lit, and show your face. Your first photo will be your profile picture.",
      },
      {
        question: "What information should I include?",
        answer: "Include a good bio that shows your personality, your interests, and what you're looking for. Be honest and authentic—it helps you match with people who are genuinely interested in you.",
      },
    ],
  },
  {
    id: "matching",
    title: "💕 Matching & Connections",
    items: [
      {
        question: "How does the matching algorithm work?",
        answer: "We use an advanced algorithm that considers your preferences, interests, location, and compatibility with other users. The more complete your profile, the better our matches will be.",
      },
      {
        question: "What does the match score mean?",
        answer: "The match score (0-100%) shows how compatible you are with someone based on shared interests, preferences, and profile information. Higher scores suggest better compatibility.",
      },
      {
        question: "Can I undo a connection?",
        answer: "Once you've connected with someone, you can block them or remove them from your connected list. However, the initial connection action cannot be undone—you'll need to send a new connection request.",
      },
      {
        question: "How do I see my matches?",
        answer: "Go to the Matches tab in your dashboard. You'll see recommended profiles sorted by compatibility score. You can like, pass, or send a connection request.",
      },
    ],
  },
  {
    id: "messaging",
    title: "💬 Messaging",
    items: [
      {
        question: "How do I send a message?",
        answer: "After connecting with someone, go to the Messages tab. You can view all your conversations and send messages directly. Messages are private and encrypted.",
      },
      {
        question: "Can I unsend a message?",
        answer: "Currently, messages can only be deleted from your view. The recipient will still see the message on their end. We recommend being thoughtful before sending!",
      },
      {
        question: "What if someone is harassing me?",
        answer: "If you're being harassed, you can block the user, report them, and our support team will investigate. We take safety very seriously.",
      },
      {
        question: "How do I know if someone has read my message?",
        answer: "You'll see a 'read' indicator when the other person has seen your message. This helps you know if they're engaged in the conversation.",
      },
    ],
  },
  {
    id: "safety",
    title: "🔒 Safety & Privacy",
    items: [
      {
        question: "Is my personal information safe?",
        answer: "Yes! We use industry-standard encryption and security measures to protect your data. We never share your information with third parties without your consent.",
      },
      {
        question: "Can I make my profile private?",
        answer: "You can adjust your visibility settings in Settings > Privacy. You can choose who sees your profile (everyone, verified users, or connections only).",
      },
      {
        question: "How do I block someone?",
        answer: "Go to their profile and click 'Block User'. They won't be able to see your profile or send you messages. You can unblock them anytime from your blocked users list.",
      },
      {
        question: "What should I do if I feel unsafe?",
        answer: "Trust your instincts. Never share personal information like your address or financial details. Report any suspicious behavior immediately, and we'll help.",
      },
    ],
  },
  {
    id: "subscription",
    title: "💎 Subscription & Billing",
    items: [
      {
        question: "What's the difference between free and premium?",
        answer: "Free users can browse and match. Premium members get unlimited likes, message filters, advanced search, and priority customer support.",
      },
      {
        question: "How much does premium cost?",
        answer: "Premium pricing varies by subscription length. Check your subscription page for current pricing. We offer monthly, 3-month, and annual plans.",
      },
      {
        question: "Can I cancel my subscription?",
        answer: "Yes! You can cancel anytime from your subscription settings. Your premium features will remain active until your billing cycle ends.",
      },
      {
        question: "Why was I charged?",
        answer: "Check your subscription settings to see active subscriptions. If you see an unexpected charge, contact our billing support team immediately.",
      },
    ],
  },
  {
    id: "account",
    title: "👤 Account & Settings",
    items: [
      {
        question: "How do I change my password?",
        answer: "Go to Settings > Security > Change Password. Enter your current password, then your new password twice. Save your changes.",
      },
      {
        question: "How do I delete my account?",
        answer: "In Settings > Account > Delete Account, you'll find the option to permanently delete your account and all associated data. This action cannot be undone.",
      },
      {
        question: "Can I have multiple accounts?",
        answer: "Each person should have one account. Having multiple accounts violates our terms of service and may result in a ban.",
      },
      {
        question: "How do I update my preferences?",
        answer: "Go to Settings > Match Preferences. You can adjust age range, distance, interests, and what you're looking for in a match.",
      },
    ],
  },
];

export default function HelpPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedInUser] = useState({ name: "User", avatar: "/pic2datebukladies/default.jpeg" });

  const filteredCategories = helpCategories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  const toggleCategory = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-gray-900">
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-pink-200 bg-white/80 backdrop-blur-xl lg:flex">
          <div className="p-6 border-b border-pink-200 flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-pink-500/50">
              <AvatarImage src={loggedInUser.avatar} alt={loggedInUser.name} />
              <AvatarFallback>{loggedInUser.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{loggedInUser.name}</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Online
              </p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 transition">
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link href="/dashboard/browse" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 transition">
              <Search size={18} />
              <span>Explore</span>
            </Link>
            <Link href="/dashboard/matches" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 transition">
              <Heart size={18} />
              <span>Matches</span>
            </Link>
            <Link href="/dashboard/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 transition">
              <MessageCircle size={18} />
              <span>Messages</span>
            </Link>
            <Link href="/dashboard/subscription" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 transition">
              <CreditCard size={18} />
              <span>Subscription</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 transition">
              <Bell size={18} />
              <span>Notifications</span>
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 transition">
              <Settings size={18} />
              <span>Settings</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-pink-50">
              <HelpCircle size={18} className="text-pink-600" />
              <span className="text-pink-600 font-medium">Help</span>
            </div>
          </nav>

          <div className="p-4 border-t border-white/10">
            <Link href="/logout" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">
              <LogOut size={18} />
              <span>Logout</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="p-6 border-b border-pink-200 bg-white/80 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Help & Support</h1>
                <p className="text-gray-600 mt-2">Find answers to your questions about DateBuk</p>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" size={20} />
                <Input
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-pink-50 border-pink-200 text-gray-900 placeholder:text-gray-400 py-3 text-base"
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {filteredCategories.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <HelpCircle className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600 text-lg">No results found for "{searchQuery}"</p>
                  <p className="text-gray-500 text-sm mt-2">Try searching for something else or contact support</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {filteredCategories.map((category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-pink-200 overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-pink-50 transition"
                      >
                        <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
                        <ChevronDown
                          size={20}
                          className={`text-pink-600 transition ${
                            expandedId === category.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Category Items */}
                      {expandedId === category.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-t border-pink-200"
                        >
                          {category.items.map((item, index) => (
                            <div
                              key={index}
                              className={`p-6 ${index !== category.items.length - 1 ? "border-b border-pink-100" : ""}`}
                            >
                              <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                                <ChevronRight size={16} className="text-pink-500 mt-0.5 flex-shrink-0" />
                                {item.question}
                              </h3>
                              <p className="text-gray-600 ml-6 text-sm leading-relaxed">{item.answer}</p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Contact Support Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white text-center"
              >
                <h3 className="text-2xl font-bold mb-3">Still need help?</h3>
                <p className="mb-6 text-white/90">Can't find what you're looking for? Our support team is here to help.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/contact">
                    <Button className="bg-white text-pink-600 hover:bg-gray-100 font-semibold">
                      📧 Contact Support
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/20 font-semibold"
                    onClick={() => window.open("mailto:support@datebuk.com", "_blank")}
                  >
                    💌 Email Us
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
