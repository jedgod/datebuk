// Prisma schema additions for video date features
// Add these to apps/api/prisma/schema.prisma

/*

model DateSession {
  id                String @id @default(cuid())
  userId            String
  matchUserId       String
  roomId            String @unique
  
  status            String @default("active") // active, ended, timeout
  startedAt         DateTime @default(now())
  endedAt           DateTime?
  durationSeconds   Int @default(0)
  maxDurationSeconds Int @default(1200) // 20 minutes
  
  userLocation      String? // "Fairfax, VA"
  matchLocation     String?
  locationShared    Boolean @default(false)
  
  // Subscription/Premium features
  isExtended        Boolean @default(false)
  extensionRequests Int @default(0)
  
  user              User @relation(name: "DateSessionUser", fields: [userId], references: [id], onDelete: Cascade)
  match             User @relation(name: "DateSessionMatch", fields: [matchUserId], references: [id], onDelete: Cascade)
  
  messages          DateMessage[]
  report            SafetyReport?
  feedback          DateFeedback?
  followUp          DateFollowUp?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
  @@index([matchUserId])
  @@index([status])
}

model DateMessage {
  id                String @id @default(cuid())
  sessionId         String
  senderId          String
  content           String
  messageType       String @default("text") // text, icebreaker, system
  
  session           DateSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sender            User @relation(fields: [senderId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  
  @@index([sessionId])
  @@index([senderId])
}

model SafetyReport {
  id                String @id @default(cuid())
  sessionId         String @unique
  reporterId        String
  reportedUserId    String
  
  category          String // inappropriate, harassment, fraud, safety, other
  description       String @db.Text
  blockUser         Boolean @default(false)
  endCall           Boolean @default(false)
  
  status            String @default("submitted") // submitted, reviewing, resolved, dismissed
  moderationNotes   String? @db.Text
  
  session           DateSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  reporter          User @relation(name: "ReportedBy", fields: [reporterId], references: [id])
  reported          User @relation(name: "ReportedUser", fields: [reportedUserId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([sessionId])
  @@index([reporterId])
  @@index([reportedUserId])
  @@index([status])
}

model DateFeedback {
  id                String @id @default(cuid())
  sessionId         String @unique
  userId            String
  
  overallVibe       Int @default(5) // 1-10
  connectionLevel   String // low, medium, high, very_high
  wouldMeetAgain    Boolean
  highlights        String[] // ["conversation", "chemistry", "humor", "authentic", "passion"]
  reflections       String @db.Text
  
  // AI Analysis
  sentimentScore    Float?
  themes            String[]
  compatibilityScore Float?
  
  // Matching algorithm
  matchQualityUpdate Boolean @default(false)
  
  session           DateSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  
  @@index([sessionId])
  @@index([userId])
}

model DateFollowUp {
  id                String @id @default(cuid())
  sessionId         String @unique
  userId            String
  
  interested        Boolean
  suggestedDate     String? // ISO date
  suggestedTime     String? // HH:MM format
  personalMessage   String? @db.Text
  
  // Match status
  matchInterested   Boolean @default(false) // If both interested, this becomes true
  matchConfirmed    Boolean @default(false) // Both confirmed the next date
  
  session           DateSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([sessionId])
  @@index([userId])
  @@index([interested])
}

model UserDateReadiness {
  id                String @id @default(cuid())
  userId            String @unique
  
  // Intent modes
  currentIntent     String @default("casual") // faith, casual, professional
  intents           String[] @default(["casual"])
  
  // Readiness score (1-100)
  readinessScore    Int @default(50)
  sharedValues      String[]
  dealbreakers      String[]
  
  // Dating history
  successfulDates   Int @default(0)
  relationshipsFormed Int @default(0)
  
  // AI profile improvements
  lastAnalysis      DateTime?
  improvementAreas  String[]
  
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model ModerationQueue {
  id                String @id @default(cuid())
  reportId          String @unique
  
  priority          String @default("normal") // low, normal, high, urgent
  status            String @default("pending") // pending, reviewing, actioned, dismissed
  
  reason            String
  evidence          String[] // URLs or snapshot references
  
  assignedTo        String?
  actionTaken       String? // warning, suspension, ban
  actionReason      String?
  
  report            SafetyReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  resolvedAt        DateTime?
  
  @@index([status])
  @@index([priority])
}

*/
