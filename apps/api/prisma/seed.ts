import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding database with 10 demo users...");

  // Hash passwords
  const demoPassword = await hashPassword("password123");

  // Real photo URLs from pic2datebukladies folder
  const photoLibrary = [
    "/pic2datebukladies/IMG_5825.jpeg",
    "/pic2datebukladies/IMG_5827.jpeg",
    "/pic2datebukladies/IMG_5828.jpeg",
    "/pic2datebukladies/IMG_5830.jpeg",
    "/pic2datebukladies/IMG_5833.jpeg",
    "/pic2datebukladies/IMG_5836.jpeg",
    "/pic2datebukladies/IMG_5837.jpeg",
    "/pic2datebukladies/IMG_5838.jpeg",
    "/pic2datebukladies/IMG_5839.jpeg",
    "/pic2datebukladies/IMG_5840.jpeg",
    "/pic2datebukladies/IMG_5841.jpeg",
    "/pic2datebukladies/IMG_5842.jpeg",
    "/pic2datebukladies/IMG_5843.jpeg",
    "/pic2datebukladies/IMG_5844.jpeg",
    "/pic2datebukladies/IMG_5845.jpeg",
    "/pic2datebukladies/IMG_5846.jpeg",
    "/pic2datebukladies/IMG_5848.jpeg",
    "/pic2datebukladies/IMG_5849.jpeg",
    "/pic2datebukladies/Gigi.jpeg",
    "/pic2datebukladies/Faith Anderson.jpeg",
  ];

  // Create 10 demo users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "emma@example.com" },
      update: {
        photos: [photoLibrary[0], photoLibrary[1]],
      },
      create: {
        email: "emma@example.com",
        password: demoPassword,
        displayName: "Emma J",
        fullName: "Emma Johnson",
        gender: "FEMALE",
        genderPreference: "MEN",
        datingIntent: "CASUAL",
        age: 28,
        locationCity: "Miami",
        locationState: "FL",
        locationCountry: "US",
        bio: "Adventure seeker looking for fun dates",
        interests: ["hiking", "beach", "travel"],
        photos: [photoLibrary[0], photoLibrary[1]],
        trustScore: 85,
        trustLevel: "HIGH",
        visibility: "BOOSTED",
        emailVerified: true,
        verifiedVideo: true,
        videoApproved: true,
        subscriptionTier: "PREMIUM",
      },
    }),
    prisma.user.upsert({
      where: { email: "liam@example.com" },
      update: {
        photos: [photoLibrary[2], photoLibrary[3]],
      },
      create: {
        email: "liam@example.com",
        password: demoPassword,
        displayName: "Liam S",
        fullName: "Liam Smith",
        gender: "MALE",
        genderPreference: "WOMEN",
        datingIntent: "FAITH",
        age: 30,
        locationCity: "Austin",
        locationState: "TX",
        locationCountry: "US",
        bio: "Faith-driven, seeking meaningful connections",
        interests: ["church", "volunteering", "reading"],
        photos: [photoLibrary[2], photoLibrary[3]],
        trustScore: 65,
        trustLevel: "MEDIUM",
        visibility: "NORMAL",
        emailVerified: true,
        videoApproved: false,
        subscriptionTier: "FREE",
      },
    }),
    prisma.user.upsert({
      where: { email: "sofia@example.com" },
      update: {
        photos: [photoLibrary[4], photoLibrary[5]],
      },
      create: {
        email: "sofia@example.com",
        password: demoPassword,
        displayName: "Sofia R",
        fullName: "Sofia Rodriguez",
        gender: "FEMALE",
        genderPreference: "EVERYONE",
        datingIntent: "PROFESSIONAL",
        age: 25,
        locationCity: "New York",
        locationState: "NY",
        locationCountry: "US",
        bio: "Networking and professional growth",
        interests: ["business", "tech", "writing"],
        photos: [photoLibrary[4], photoLibrary[5]],
        trustScore: 45,
        trustLevel: "LOW",
        visibility: "LOW",
        emailVerified: false,
        verifiedVideo: true,
        videoApproved: true,
        subscriptionTier: "PREMIUM",
      },
    }),
    prisma.user.upsert({
      where: { email: "noah@example.com" },
      update: {
        photos: [photoLibrary[6], photoLibrary[7]],
      },
      create: {
        email: "noah@example.com",
        password: demoPassword,
        displayName: "Noah T",
        fullName: "Noah Thompson",
        gender: "MALE",
        genderPreference: "WOMEN",
        datingIntent: "CASUAL",
        age: 31,
        locationCity: "Denver",
        locationState: "CO",
        locationCountry: "US",
        bio: "Outdoor enthusiast",
        interests: ["skiing", "hiking", "photography"],
        photos: [photoLibrary[6], photoLibrary[7]],
        trustScore: 95,
        trustLevel: "HIGH",
        visibility: "BOOSTED",
        emailVerified: true,
        verifiedVideo: true,
        videoApproved: true,
        subscriptionTier: "ELITE",
      },
    }),
    prisma.user.upsert({
      where: { email: "isabella@example.com" },
      update: {
        photos: [photoLibrary[8], photoLibrary[9]],
      },
      create: {
        email: "isabella@example.com",
        password: demoPassword,
        displayName: "Isabella M",
        fullName: "Isabella Martinez",
        gender: "FEMALE",
        genderPreference: "MEN",
        datingIntent: "FAITH",
        age: 26,
        locationCity: "Los Angeles",
        locationState: "CA",
        locationCountry: "US",
        bio: "Family-oriented",
        interests: ["cooking", "reading", "family"],
        photos: [photoLibrary[8], photoLibrary[9]],
        trustScore: 75,
        trustLevel: "MEDIUM",
        visibility: "NORMAL",
        emailVerified: true,
        videoApproved: false,
        subscriptionTier: "FREE",
      },
    }),
    prisma.user.upsert({
      where: { email: "ethan@example.com" },
      update: {
        photos: [photoLibrary[10], photoLibrary[11]],
      },
      create: {
        email: "ethan@example.com",
        password: demoPassword,
        displayName: "Ethan K",
        fullName: "Ethan King",
        gender: "MALE",
        genderPreference: "WOMEN",
        datingIntent: "PROFESSIONAL",
        age: 28,
        locationCity: "Chicago",
        locationState: "IL",
        locationCountry: "US",
        bio: "Career-focused entrepreneur",
        interests: ["networking", "books", "startups"],
        photos: [photoLibrary[10], photoLibrary[11]],
        trustScore: 30,
        trustLevel: "LOW",
        visibility: "HIDDEN",
        emailVerified: false,
        videoApproved: false,
        subscriptionTier: "FREE",
      },
    }),
    prisma.user.upsert({
      where: { email: "mia@example.com" },
      update: {
        photos: [photoLibrary[12], photoLibrary[13]],
      },
      create: {
        email: "mia@example.com",
        password: demoPassword,
        displayName: "Mia L",
        fullName: "Mia Lopez",
        gender: "FEMALE",
        genderPreference: "MEN",
        datingIntent: "CASUAL",
        age: 24,
        locationCity: "Seattle",
        locationState: "WA",
        locationCountry: "US",
        bio: "Fun-loving traveler",
        interests: ["travel", "music", "art"],
        photos: [photoLibrary[12], photoLibrary[13]],
        trustScore: 90,
        trustLevel: "HIGH",
        visibility: "BOOSTED",
        emailVerified: true,
        verifiedVideo: true,
        videoApproved: true,
        subscriptionTier: "PREMIUM",
      },
    }),
    prisma.user.upsert({
      where: { email: "james@example.com" },
      update: {
        photos: [photoLibrary[14], photoLibrary[15]],
      },
      create: {
        email: "james@example.com",
        password: demoPassword,
        displayName: "James P",
        fullName: "James Parker",
        gender: "MALE",
        genderPreference: "WOMEN",
        datingIntent: "FAITH",
        age: 30,
        locationCity: "Boston",
        locationState: "MA",
        locationCountry: "US",
        bio: "Community builder",
        interests: ["volunteering", "sports", "church"],
        photos: [photoLibrary[14], photoLibrary[15]],
        trustScore: 55,
        trustLevel: "MEDIUM",
        visibility: "NORMAL",
        emailVerified: true,
        videoApproved: false,
        subscriptionTier: "FREE",
      },
    }),
    prisma.user.upsert({
      where: { email: "olivia@example.com" },
      update: {
        photos: [photoLibrary[16], photoLibrary[17]],
      },
      create: {
        email: "olivia@example.com",
        password: demoPassword,
        displayName: "Olivia G",
        fullName: "Olivia Garcia",
        gender: "FEMALE",
        genderPreference: "EVERYONE",
        datingIntent: "CASUAL",
        age: 27,
        locationCity: "San Francisco",
        locationState: "CA",
        locationCountry: "US",
        bio: "Art lover",
        interests: ["painting", "museums", "design"],
        photos: [photoLibrary[16], photoLibrary[17]],
        trustScore: 20,
        trustLevel: "NEW",
        visibility: "LOW",
        emailVerified: false,
        videoApproved: false,
        subscriptionTier: "FREE",
      },
    }),
    prisma.user.upsert({
      where: { email: "benjamin@example.com" },
      update: {
        photos: [photoLibrary[18], photoLibrary[19]],
      },
      create: {
        email: "benjamin@example.com",
        password: demoPassword,
        displayName: "Benjamin H",
        fullName: "Benjamin Harris",
        gender: "MALE",
        genderPreference: "WOMEN",
        datingIntent: "PROFESSIONAL",
        age: 29,
        locationCity: "Atlanta",
        locationState: "GA",
        locationCountry: "US",
        bio: "Entrepreneur",
        interests: ["business", "innovation", "investing"],
        photos: [photoLibrary[18], photoLibrary[19]],
        trustScore: 80,
        trustLevel: "HIGH",
        visibility: "BOOSTED",
        emailVerified: true,
        verifiedVideo: true,
        videoApproved: true,
        subscriptionTier: "ELITE",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} demo users`);

  // Create 5 matches
  const matches = await Promise.all([
    prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: users[0].id, user2Id: users[1].id } },
      update: {},
      create: {
        user1Id: users[0].id,
        user2Id: users[1].id,
        intent: "CASUAL",
        lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        active: true,
      },
    }),
    prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: users[3].id, user2Id: users[2].id } },
      update: {},
      create: {
        user1Id: users[2].id,
        user2Id: users[3].id,
        intent: "FAITH",
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        active: true,
      },
    }),
    prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: users[4].id, user2Id: users[5].id } },
      update: {},
      create: {
        user1Id: users[4].id,
        user2Id: users[5].id,
        intent: "PROFESSIONAL",
        lastMessageAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        active: true,
      },
    }),
    prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: users[6].id, user2Id: users[7].id } },
      update: {},
      create: {
        user1Id: users[6].id,
        user2Id: users[7].id,
        intent: "CASUAL",
        lastMessageAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        active: true,
      },
    }),
    prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: users[8].id, user2Id: users[9].id } },
      update: {},
      create: {
        user1Id: users[8].id,
        user2Id: users[9].id,
        intent: "FAITH",
        lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${matches.length} demo matches`);

  // Create messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        matchId: matches[0].id,
        senderId: users[0].id,
        content: "Hey, how are you?",
        sentAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
    }),
    prisma.message.create({
      data: {
        matchId: matches[0].id,
        senderId: users[1].id,
        content: "Good, you?",
        sentAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      },
    }),
    prisma.message.create({
      data: {
        matchId: matches[4].id,
        senderId: users[9].id,
        content: "Hi Olivia! 😊",
        sentAt: new Date(Date.now() - 3 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${messages.length} demo messages`);

  // Create video sessions
  const videoSessions = await Promise.all([
    prisma.videoSession.create({
      data: {
        matchId: matches[0].id,
        startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 5 * 60 * 1000),
        durationSeconds: 300,
        status: "APPROVED",
        aiScores: { nudity: 0.1, explicit_audio: 0.05, overall: 0.07 },
        reportsCount: 0,
      },
    }),
    prisma.videoSession.create({
      data: {
        matchId: matches[1].id,
        startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 2 * 60 * 1000),
        durationSeconds: 120,
        status: "QUARANTINED",
        aiScores: { nudity: 0.6, explicit_audio: 0.4, overall: 0.55 },
        reportsCount: 1,
      },
    }),
    prisma.videoSession.create({
      data: {
        matchId: matches[2].id,
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 45 * 1000),
        durationSeconds: 45,
        status: "INTERRUPTED",
        aiScores: { nudity: 0.8, explicit_audio: 0.7, overall: 0.75 },
        reportsCount: 2,
        interruptionReason: "User report - inappropriate content",
      },
    }),
  ]);

  console.log(`✅ Created ${videoSessions.length} demo video sessions`);

  // Create reports
  await Promise.all([
    prisma.report.create({
      data: {
        reporterId: users[0].id,
        reportedId: users[1].id,
        sessionId: videoSessions[1].id,
        reason: "HARASSMENT",
        details: "Inappropriate comments during video call",
      },
    }),
    prisma.report.create({
      data: {
        reporterId: users[2].id,
        reportedId: users[3].id,
        sessionId: videoSessions[2].id,
        reason: "NUDITY",
        details: "Explicit content shown on camera",
      },
    }),
  ]);

  console.log("✅ Created demo reports");

  // Create flags
  await Promise.all([
    prisma.flag.create({
      data: {
        userId: users[1].id,
        sessionId: videoSessions[1].id,
        type: "NUDITY",
        aiScore: 0.65,
        resolved: false,
      },
    }),
    prisma.flag.create({
      data: {
        userId: users[3].id,
        sessionId: videoSessions[2].id,
        type: "EXPLICIT_AUDIO",
        aiScore: 0.45,
        resolved: true,
        resolution: "APPROVED",
      },
    }),
    prisma.flag.create({
      data: {
        userId: users[5].id,
        type: "HARASSMENT",
        aiScore: 0.3,
        resolved: false,
      },
    }),
  ]);

  console.log("✅ Created demo flags");

  // Create subscriptions
  await Promise.all([
    prisma.subscription.create({
      data: {
        userId: users[0].id,
        tier: "PREMIUM",
        status: "active",
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.subscription.create({
      data: {
        userId: users[3].id,
        tier: "ELITE",
        status: "active",
        currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log("✅ Created demo subscriptions");
  console.log("\n🎉 Database seeding completed successfully!");
  console.log("Demo users created with email: demo@example.com through benjamin@example.com");
  console.log("Password for all demo users: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
