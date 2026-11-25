// ADMIN QUARANTINE SYSTEM - COMPLETE SETUP GUIDE
// File: docs/QUARANTINE_SETUP.md

# Enhanced Admin Quarantine System - Setup & Integration Guide

## Overview

This guide covers the complete setup for the enhanced Admin Quarantine system with:

- Keyframe extraction and carousel display
- Waveform generation and visualization
- Real-time updates via WebSocket
- AI-powered content analysis
- Bulk operations (release, delete, escalate)

---

## Part 1: System Dependencies

### macOS

```bash
# Install ffmpeg (includes ffprobe)
brew install ffmpeg

# Install audiowaveform (optional but recommended)
brew tap bbc/audiowaveform https://github.com/bbc/audiowaveform.git
brew install bbc/audiowaveform/audiowaveform
```

### Linux (Ubuntu/Debian)

```bash
# Install ffmpeg
sudo apt-get update
sudo apt-get install ffmpeg

# Install audiowaveform (optional)
sudo apt-get install audiowaveform
# or
wget https://releases.bbc.co.uk/ARCHIVE/audio_waveform/linux64/audiowaveform && chmod +x audiowaveform
```

### Windows

```bash
# Using Chocolatey
choco install ffmpeg

# Download audiowaveform from:
# https://github.com/bbc/audiowaveform/releases
# Add to PATH
```

### Verify Installation

```bash
ffmpeg -version
ffprobe -version
audiowaveform --version  # optional
```

---

## Part 2: Environment Configuration

### Frontend (.env.local or .env)

```env
# No additional env vars needed for frontend
# All API calls go to /api/admin/quarantine
```

### Backend (.env)

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=datepage-quarantine

# Optional
TEMP_DIR=/tmp  # Temporary directory for video processing
NODE_ENV=production
```

### Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://datepage-quarantine --region us-east-1

# Set bucket policy for public read (optional)
aws s3api put-bucket-policy --bucket datepage-quarantine --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::datepage-quarantine/*"
  }]
}'

# Enable CORS
aws s3api put-bucket-cors --bucket datepage-quarantine --cors-configuration '{
  "CORSRules": [{
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["*"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'
```

---

## Part 3: Database Schema

### Update Prisma Schema

Add or update QuarantinedVideo model in `prisma/schema.prisma`:

```prisma
model QuarantinedVideo {
  id                 String   @id @default(cuid())
  videoId            String   @unique
  userId             String
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Content Analysis
  nudityScore        Int      @default(0)      // 0-100
  audioScore         Int      @default(0)      // 0-100
  severity           Int      @default(0)      // 0-100
  priority           String   @default("P5")   // P0-P5
  confidence         Float    @default(0.5)

  // Media Assets
  keyframeUrls       String[] @default([])     // Array of S3 URLs
  waveformUrl        String?                   // S3 URL
  waveformPeaks      Int[]?                    // Normalized peaks (0-255)

  // Metadata
  reason             String
  chatContext        String?
  durationSeconds    Int      @default(0)

  // Status
  status             String   @default("quarantined")

  // Moderation
  reviewedBy         String?
  reviewedAt         DateTime?
  moderatorNotes     String?

  deletedBy          String?
  deletedAt          DateTime?
  deletionReason     String?

  escalatedBy        String?
  escalatedAt        DateTime?
  escalationReason   String?

  // Timestamps
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([severity])
  @@index([priority])
  @@index([createdAt])
}
```

### Run Migration

```bash
cd apps/api
npx prisma migrate dev --name add_enhanced_quarantine
```

---

## Part 4: NPM Dependencies

### Frontend

```bash
cd apps/web

# For carousel functionality
pnpm install react-slick slick-carousel

# For waveform visualization
pnpm install @wavesurfer/react wavesurfer.js

# For infinite scroll and loading
pnpm install react-infinite-scroll-component react-loading-skeleton

# For keyboard shortcuts
pnpm install react-hotkeys-hook

# For real-time updates
pnpm install react-use-websocket
```

### Backend

```bash
cd apps/api

# AWS SDK
pnpm install aws-sdk

# Already included but verify:
# pnpm install express prisma
```

---

## Part 5: API Routes Setup

### File Structure

```
apps/api/src/
├── routes/
│   └── admin/
│       └── quarantine.ts
├── utils/
│   └── videoProcessing.ts
└── services/
    └── quarantineService.ts
```

### Register Routes (Express Setup)

In your main server file:

```typescript
import quarantineRouter from "./routes/admin/quarantine";
import { setupQuarantineWebSocket } from "./routes/admin/quarantine";

// Express
app.use("/", quarantineRouter);

// WebSocket (Socket.io)
const io = require("socket.io")(server);
setupQuarantineWebSocket(io);
```

---

## Part 6: Frontend Integration

### Update Admin Quarantine Page

The page is already set up in:
`apps/web/src/app/(admin)/admin/quarantine/page.tsx`

### Add Carousel Enhancement (Optional)

To add the keyframe carousel, update the Grid render section:

```tsx
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// In the grid item:
<Slider
  dots={true}
  infinite={true}
  speed={500}
  slidesToShow={1}
  slidesToScroll={1}
  arrows={false}
  autoplay={true}
  autoplaySpeed={3000}
>
  {item.keyframes.map((url, i) => (
    <div key={i} className="relative">
      <img
        src={url}
        alt={`Keyframe ${i + 1}`}
        className="w-full aspect-video object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-xs rounded text-white">
        {new Date(i * (item.durationSec / item.keyframes.length) * 1000)
          .toISOString()
          .substr(14, 5)}
      </div>
    </div>
  ))}
</Slider>;
```

### Add Waveform Visualization (Optional)

```tsx
import WavesurferPlayer from "@wavesurfer/react";

// Option 1: Static image (current implementation)
{
  item.waveformUrl && (
    <img
      src={item.waveformUrl}
      alt="Waveform"
      className="w-full h-16 object-contain p-4"
    />
  );
}

// Option 2: Interactive waveform (with peaks data)
{
  item.waveformData && (
    <div className="p-4">
      <WavesurferPlayer
        height={64}
        waveColor="#FFA500"
        progressColor="#FF4500"
        peaks={item.waveformData}
        normalize={true}
        interact={true}
      />
    </div>
  );
}
```

---

## Part 7: Testing

### Test Quarantine Creation

```bash
curl -X POST http://localhost:3000/api/admin/quarantine \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test_video_123",
    "userId": "user_456",
    "videoPath": "/path/to/video.mp4",
    "reason": "Suspected policy violation",
    "durationSec": 120
  }'
```

### Expected Response

```json
{
  "id": "quarantine_123",
  "videoId": "test_video_123",
  "user": { "name": "...", "avatar": "...", "trust": "low" },
  "severity": 75,
  "priority": "P1",
  "nudityScore": 82,
  "audioScore": 45,
  "keyframes": [
    "https://datepage-quarantine.s3.amazonaws.com/quarantine/test_video_123/keyframes/frame_0.jpg",
    "..."
  ],
  "waveformUrl": "https://datepage-quarantine.s3.amazonaws.com/quarantine/test_video_123/waveform.png",
  "status": "quarantined"
}
```

### Test Bulk Release

```bash
curl -X POST http://localhost:3000/api/admin/quarantine/item_id/release \
  -H "Content-Type: application/json" \
  -d '{
    "moderatorId": "admin_123",
    "notes": "False positive, video is safe"
  }'
```

---

## Part 8: Real-Time Updates (WebSocket)

### Frontend WebSocket Connection

```typescript
import useWebSocket from "react-use-websocket";

const { lastJsonMessage } = useWebSocket(
  "wss://your-domain.com/ws/quarantine",
  {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
  },
);

useEffect(() => {
  if (lastJsonMessage?.type === "quarantine-update") {
    const updated = lastJsonMessage.item;
    // Update UI with new quarantine item
    setItems((prev) => [updated, ...prev]);
  }
}, [lastJsonMessage]);
```

### Backend WebSocket Broadcast

```typescript
// When a new quarantine event occurs:
import { broadcastQuarantineUpdate } from './routes/admin/quarantine'

const io = require('socket.io')(server)
const quarantineItem = await prisma.quarantinedVideo.create({ ... })
broadcastQuarantineUpdate(io, quarantineItem)
```

---

## Part 9: Content Analysis Integration

### AWS Rekognition Example

```typescript
// In videoProcessing.ts, replace analyzeVideoContent:

async analyzeVideoContent(videoPath: string): Promise<ContentAnalysisResult> {
  try {
    const rekognition = new AWS.Rekognition()
    // Assuming video is already in S3
    const response = await rekognition.startContentModeration({
      Video: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: 'videos/path/to/video.mp4',
        },
      },
      ClientRequestToken: videoId,
    }).promise()

    // Poll for results
    const jobId = response.JobId
    let status = 'IN_PROGRESS'
    let results = []

    while (status === 'IN_PROGRESS') {
      const jobResponse = await rekognition.getContentModerationJobStatus({ JobId: jobId }).promise()
      status = jobResponse.JobStatus
      if (status === 'SUCCEEDED') {
        results = jobResponse.ContentModerationDetections || []
      }
      await new Promise(r => setTimeout(r, 1000))
    }

    // Calculate scores from results
    const nudityDetections = results.filter((r: any) => r.ModerationLabel?.Name === 'Explicit Nudity')
    const nudityScore = Math.max(...nudityDetections.map((r: any) => r.ModerationLabel?.Confidence || 0))

    return {
      nudityScore: Math.round(nudityScore),
      audioScore: 0, // Add audio analysis if needed
      confidence: 0.85,
    }
  } catch (error) {
    console.error('Content analysis failed:', error)
    return { nudityScore: 0, audioScore: 0, confidence: 0 }
  }
}
```

---

## Part 10: Monitoring & Logging

### Add Logging

```typescript
// In API routes, add structured logging:
import pino from "pino";

const logger = pino();

router.post("/api/admin/quarantine", async (req, res) => {
  logger.info({ videoId: req.body.videoId }, "Quarantine processing started");
  try {
    // ... process ...
    logger.info(
      { videoId, duration: endTime },
      "Quarantine processing completed",
    );
  } catch (error) {
    logger.error(
      { videoId, error: error.message },
      "Quarantine processing failed",
    );
  }
});
```

### Monitor S3 Uploads

```bash
# Monitor bucket size
aws s3 ls s3://datepage-quarantine --recursive --summarize --human-readable

# Set lifecycle policy to delete old files
aws s3api put-bucket-lifecycle-configuration --bucket datepage-quarantine \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "DeleteOldQuarantines",
      "Status": "Enabled",
      "ExpirationInDays": 90,
      "Prefix": "quarantine/"
    }]
  }'
```

---

## Part 11: Troubleshooting

### Issue: "ffmpeg not found"

**Solution:** Ensure ffmpeg is installed and in PATH

```bash
which ffmpeg  # macOS/Linux
where ffmpeg  # Windows
```

### Issue: "Cannot find module 'react-slick'"

**Solution:** Install missing dependencies

```bash
pnpm install react-slick slick-carousel
```

### Issue: S3 upload fails with 403

**Solution:** Check AWS credentials and bucket policy

```bash
# Verify credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3api get-bucket-acl --bucket datepage-quarantine
```

### Issue: WebSocket connection fails

**Solution:** Ensure WebSocket server is configured

```typescript
// In server setup:
const io = require("socket.io")(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
```

---

## Part 12: Performance Optimization

### Optimize Keyframe Extraction

```typescript
// Use lower resolution for faster processing
await extractKeyframes(videoPath, videoId, 6, "160x90"); // Instead of 10, 320x180

// Or use thumbnail extraction instead of full keyframes:
// ffmpeg -i video.mp4 -vf fps=1 thumb_%04d.jpg
```

### Async Processing

```typescript
// Don't wait for full processing in API response
// Instead, return immediately and process in background

router.post('/api/admin/quarantine', async (req, res) => {
  const item = await prisma.quarantinedVideo.create({
    data: { videoId, status: 'processing', ... }
  })

  // Process asynchronously
  processVideo(videoPath, videoId).then(results => {
    prisma.quarantinedVideo.update({
      where: { id: item.id },
      data: { ...results, status: 'quarantined' }
    })
    // Broadcast update via WebSocket
    broadcastQuarantineUpdate(io, updatedItem)
  })

  res.json({ id: item.id, status: 'processing' })
})
```

### Cache Keyframes & Waveforms

```typescript
// Check if processing already exists
const existing = await prisma.quarantinedVideo.findUnique({
  where: { videoId },
});
if (existing?.keyframeUrls?.length > 0) {
  return existing; // Skip reprocessing
}
```

---

## Part 13: Security Considerations

### Validate File Types

```typescript
// Only accept video files
const allowedMimes = ["video/mp4", "video/webm", "video/quicktime"];
if (!allowedMimes.includes(req.file.mimetype)) {
  return res.status(400).json({ error: "Invalid file type" });
}
```

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const quarantineLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 requests per window
  message: "Too many quarantine requests, try again later",
});

router.post("/api/admin/quarantine", quarantineLimiter, async (req, res) => {
  // ... handler
});
```

### Auth Check

```typescript
// Ensure only admins can quarantine content
router.post("/api/admin/quarantine", async (req, res) => {
  const user = req.user; // From JWT middleware
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  // ... handler
});
```

---

## Deployment Checklist

- [ ] ffmpeg installed on server
- [ ] AWS S3 bucket created and configured
- [ ] AWS IAM credentials set in `.env`
- [ ] Prisma migrations run
- [ ] All npm packages installed
- [ ] API routes registered
- [ ] WebSocket server configured
- [ ] Frontend page updated
- [ ] Testing completed
- [ ] Error handling verified
- [ ] Rate limiting enabled
- [ ] Auth checks in place
- [ ] S3 lifecycle policy set
- [ ] Logging configured
- [ ] Monitoring dashboard setup

---

## Support & Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [React WebSocket](https://www.npmjs.com/package/react-use-websocket)
- [Wavesurfer.js](https://wavesurfer-js.org/)
