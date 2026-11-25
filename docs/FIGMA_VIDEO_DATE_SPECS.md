# Video Date Page - Figma Design Specification

## Design System Overview

### Color Palette

- **Primary Actions**: #f04438 (Red)
- **Secondary Actions**: #6366f1 (Indigo)
- **Success States**: #10b981 (Green)
- **Connection Quality**:
  - Excellent: #10b981 (Green)
  - Good: #3b82f6 (Blue)
  - Fair: #f59e0b (Amber)
  - Poor: #ef4444 (Red)
- **Neutral Shades**:
  - 900: #111827 (Text)
  - 700: #374151
  - 500: #6b7280
  - 200: #e5e7eb
  - 50: #f9fafb

### Typography

- **Heading H1**: 32px, 700 weight, 1.2 line-height
- **Heading H2**: 24px, 700 weight, 1.3 line-height
- **Heading H3**: 20px, 600 weight, 1.4 line-height
- **Body**: 14px, 400 weight, 1.5 line-height
- **Caption**: 12px, 400 weight, 1.4 line-height
- **Font**: Inter (fallback: system sans-serif)

### Spacing System

- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px

### Border Radius

- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- full: 9999px

## Page Layout Architecture

### Container Structure

```
.video-date-page (100vh)
├── header (VideoDateHeader)
├── main-content (flex-1)
│   └── video-feed-section
│       ├── remote-video (MainVideoFeed)
│       ├── local-video (LocalVideoFeed - PiP)
│       └── chat-sidebar (if visible)
└── controls (VideoDateControls - fixed bottom)
```

### Responsive Breakpoints

- **Mobile**: 0px - 640px (1 column, stacked)
- **Tablet**: 641px - 1024px (1.2:1 ratio)
- **Desktop**: 1025px+ (1.4:1 ratio)

## Component Specifications

### 1. VideoDateHeader Component

**File**: `src/components/video-date/VideoDateHeader.tsx`
**Frame**: 100% width × 100px (auto)
**Location**: Top of page, sticky

**Layout**: 3-section horizontal

- **Left** (30%): Person info
  - Name + Age (H3, 20px)
  - Verified badge (Caption, green checkmark)
- **Center** (50%): Time + Connection + Status
  - Clock icon + Time display (mono font, mono green)
  - Connection quality indicator (colored dot + label)
  - "Both can extend" badge (if applicable)
- **Right** (20%): Actions
  - Report button (outline, red text)
  - Block button (outline, red text)

**Purpose & Values Section**:

- Subtext below main section
- 2 items: 📍 Purpose, ✨ Values
- Caption text, neutral colors

**Colors**:

- Background: white (#FFFFFF)
- Border: neutral-200
- Text: neutral-900
- Icons: neutral-500

**Spacing**:

- Container padding: lg (16px)
- Internal gaps: md (12px)
- Section gaps: xl (24px)

### 2. MainVideoFeed Component

**File**: `src/components/video-date/MainVideoFeed.tsx`
**Aspect Ratio**: 16:9
**Background**: Gradient (gray-900 to purple-900 to indigo-900)
**Location**: Main content area (flex-1)

**Elements**:

- Video stream (responsive, object-cover)
- Location overlay (bottom-left, black/60 backdrop)
  - MapPin icon + Location text
  - Padding: md (12px)
  - Border-radius: lg (12px)
- Gradient overlay (bottom-to-top, black/40 transparent)

**Interactivity**:

- Double-click to fullscreen
- Hover: Show duration timer (optional)

### 3. LocalVideoFeed Component

**File**: `src/components/video-date/LocalVideoFeed.tsx`
**Dimensions**: 96px × 128px (w-24 h-32)
**Location**: Fixed bottom-right, above controls
**Border**: 2px white, shadow-lg

**Elements**:

- Video stream (object-cover)
- Avatar + Verified badge (top center)
  - Avatar: 24px (w-6 h-6)
  - Verified: CheckCircle2 icon, 16px, green-400
- Name label (bottom, black/60 background)
  - Padding: 4px 8px
  - Caption text

**Interactivity**:

- Hover: Expand slightly
- Tap to swap (show swap icon)

### 4. VideoDateControls Component

**File**: `src/components/video-date/VideoDateControls.tsx`
**Dimensions**: 100% × 72px (fixed bottom)
**Layout**: Horizontal flex, center-aligned
**Spacing**: md (12px) between buttons

**Button Elements** (left to right):

1. Mute (circular, 48px, secondary/destructive if active)
   - Icon: Volume2 or VolumeX
2. Camera (circular, 48px)
   - Icon: Video or VideoOff
3. Chat (circular, 48px)
   - Icon: MessageCircle
4. Icebreaker (circular, 48px)
   - Icon: Sparkles
5. More (circular, 48px)
   - Icon: MoreVertical
6. [Spacer]
7. End Call (circular, 56px, bg-red-500, prominent)
   - Icon: Phone (rotated 135deg)

**Colors**:

- Default buttons: secondary (neutral)
- Active/Muted: destructive (red)
- End Call: bg-red-500 hover:bg-red-600
- Icon color: white (on red), neutral-700 (on secondary)

**Border Radius**: full (9999px)

### 5. VideoDateChat Component

**File**: `src/components/video-date/VideoDateChat.tsx`
**Dimensions**: 288px × flex-1 (w-72)
**Location**: Right sidebar (if visible)
**Layout**: Vertical flex with tabs

**Tab Bar**:

- 2 tabs: "Chat" + "Icebreakers"
- Border-bottom: neutral-200
- Tab underline: blue-500
- Padding: lg (16px) horizontal

**Chat Tab**:

- ScrollArea with message history
- Messages: alternating left/right with rounded bubbles
  - User messages: blue background, white text, right-aligned
  - Remote messages: neutral-100 background, text-right
  - Bubble padding: md (12px)
  - Border-radius: lg (12px)
- Input section (sticky bottom):
  - Input field + Send button
  - Border-top: neutral-200
  - Padding: md (12px)

**Icebreakers Tab**:

- Suggested prompts (buttons)
- Full-width, text-left aligned
- Icon: Zap (amber-500)
- Hover: bg-hover state
- Click: Send as message

**Spacing**: md/lg throughout

### 6. ReportModal Component

**File**: `src/components/video-date/ReportModal.tsx`
**Type**: Dialog (centered, max-w-md)
**Background Backdrop**: black/50

**Sections**:

1. **Header**:
   - Title: "Report [Name]" (H3, red icon)
   - Description: "Help us keep the community safe. Your report is confidential."

2. **Category Selection** (RadioGroup):
   - 5 options with icons
   - Padding: md (12px)
   - Selected state: blue highlight

3. **Description Textarea**:
   - Placeholder: "Tell us more about what happened..."
   - Height: 24px (h-24)
   - Required

4. **Actions Checklist**:
   - Block this user
   - End call immediately
   - Background: neutral-50, border: neutral-200

5. **Warning Banner**:
   - Background: amber-50, border: amber-200
   - Icon: AlertTriangle (amber-600)
   - Caption text: "False reports violate our community guidelines..."

6. **Footer Buttons**:
   - Cancel (outline)
   - Submit Report (red, disabled if no description)

### 7. CalendarFollowupFlow Component

**File**: `src/components/video-date/CalendarFollowupFlow.tsx`
**Type**: Dialog (centered, max-w-md)

**Sections**:

1. **Interest Selection** (RadioGroup):
   - 2 large buttons
   - Option 1: "Yes, I'm interested! 🎉"
   - Option 2: "Not right now"
   - Padding: md (12px)
   - Border: neutral-200

2. **Conditional Date/Time** (if interested):
   - Background: green-50, border: green-200
   - Date input (type="date")
   - Time input (type="time")
   - Personal message textarea
   - Spacing: md (12px)

3. **Info Banner** (if not interested):
   - Background: blue-50, border: blue-200
   - Text: "If they express interest, their profile will appear in your matches."

4. **Footer Buttons**:
   - Skip for now (outline)
   - Continue (enabled if interested=true && date/time filled)

### 8. PostDateReflection Component

**File**: `src/components/video-date/PostDateReflection.tsx`
**Type**: Dialog (centered, max-w-md, max-h-[90vh] overflow-y-auto)

**Sections**:

1. **Overall Vibe** (Slider + Emoji):
   - Range: 1-10
   - Visual emoji scale
   - Display: "[emoji] X/10"

2. **Connection Level** (RadioGroup):
   - 4 options: Low, Medium, High, Very High
   - Caption descriptions

3. **What Stood Out** (Button Grid):
   - 2-column grid
   - Options: Conversation, Chemistry, Humor, Authentic, Passion
   - Icons + labels
   - Toggle-style buttons (default/selected state)

4. **Reflections TextArea**:
   - Placeholder: "What was on your mind?"
   - Height: h-20

5. **Would Meet Again** (Button Pair):
   - 2 large buttons: "❤️ Yes!" / "👋 Not for me"
   - Border: neutral-300, dashed
   - Selected: bg-blue/red

6. **Footer Buttons**:
   - Skip (outline)
   - Save Feedback (enabled if wouldMeetAgain selected)

## Figma Export Instructions

### Component Frames

1. **Create Main Frame**: "Video Date Page - Full"
   - Width: 1440px (desktop default)
   - Height: 900px (16:9 aspect)
   - Background: gradient

2. **Sub-frames** (in order of appearance):
   - VideoDateHeader (1440x100)
   - MainVideoFeed (flex layout)
   - LocalVideoFeed (overlay PiP)
   - VideoDateControls (1440x72, bottom)
   - Modals (overlay, center-aligned)

3. **Responsive Variants**:
   - Desktop (1440px)
   - Tablet (768px)
   - Mobile (375px)

4. **Interactive Prototypes**:
   - Button → Modal (Report button → ReportModal)
   - Button → Panel (Chat button → Chat sidebar)
   - Button → Flow (End Call → FollowupFlow)
   - Button → Reflection (Follow-up → ReflectionForm)

### Design Tokens File

```json
{
  "colors": {
    "primary": "#f04438",
    "secondary": "#6366f1",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "neutral": {
      "900": "#111827",
      "700": "#374151",
      "500": "#6b7280",
      "200": "#e5e7eb",
      "50": "#f9fafb"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "24px",
    "2xl": "32px"
  },
  "typography": {
    "heading1": "32px/700",
    "heading2": "24px/700",
    "heading3": "20px/600",
    "body": "14px/400",
    "caption": "12px/400"
  },
  "borderRadius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "full": "9999px"
  }
}
```

## Animation Specs

- **Modal Entrance**: Fade in + Scale from 0.95 (150ms cubic-bezier(0.16, 1, 0.3, 1))
- **Button Hover**: Slightly darker background + scale 1.05 (100ms)
- **Connection Quality Dot**: Pulse every 2 seconds (opacity 0.5 → 1)
- **Message Append**: Slide in from bottom (200ms)
- **Tab Switch**: Fade + slide content (150ms)

## Accessibility Specs

- **Contrast Ratios**: All text ≥ 4.5:1 against backgrounds
- **Button Sizes**: Minimum 44x44px touch target
- **Keyboard Navigation**: All interactive elements Tab-accessible
- **Focus States**: 2px outline, 2px offset
- **Labels**: All inputs have associated labels
- **ARIA**: Dialog roles, live regions for messages, button intent aria-labels
- **Color Alone**: Connection quality uses icon + text, not just color
- **Motion**: Respects prefers-reduced-motion

## Implementation Checklist

- [ ] Constants exported from design-tokens.ts
- [ ] All components use design-token values (no hardcoded colors)
- [ ] Responsive design tested at 375px, 768px, 1440px
- [ ] Keyboard navigation tested (Tab, Enter, Escape)
- [ ] Screen reader tested with NVDA/JAWS
- [ ] Color contrast verified with aXe
- [ ] Touch targets ≥ 44px on mobile
- [ ] Modals have proper focus management
- [ ] All animations smooth (60 FPS)
- [ ] Dark mode variant (optional: low priority)

---

**Version**: 1.0  
**Last Updated**: 2024  
**Design System**: DatePage Design System v2
