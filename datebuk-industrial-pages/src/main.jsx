import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Crown,
  Eye,
  Gift,
  Heart,
  HelpCircle,
  Home,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Radar,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar as RadarSeries,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './styles.css';

const people = [
  { name: 'Mausia', city: 'Lagos', score: 98, online: true },
  { name: 'Puril', city: 'Abuja', score: 94, online: false },
  { name: 'Purthex', city: 'Port Harcourt', score: 100, online: true },
  { name: 'Livek', city: 'Ibadan', score: 89, online: false },
  { name: 'Nagno', city: 'Enugu', score: 92, online: true },
  { name: 'Anuole', city: 'Kano', score: 100, online: false },
  { name: 'Aplick', city: 'Lekki', score: 96, online: true },
  { name: 'Syglo', city: 'Victoria Island', score: 91, online: false },
];

const trend = [
  { d: 'Mon', v: 42 },
  { d: 'Tue', v: 68 },
  { d: 'Wed', v: 51 },
  { d: 'Thu', v: 90 },
  { d: 'Fri', v: 112 },
  { d: 'Sat', v: 156 },
  { d: 'Sun', v: 138 },
];

const radar = [
  { k: 'Values', v: 92 },
  { k: 'Lifestyle', v: 84 },
  { k: 'Interests', v: 96 },
  { k: 'Goals', v: 88 },
  { k: 'Personality', v: 91 },
];

const nearbyPeople = [
  { name: 'Adele', distance: '1.2 mi', score: 97 },
  { name: 'Nia', distance: '4.8 mi', score: 95 },
  { name: 'Tomi', distance: '8.3 mi', score: 93 },
  { name: 'Sade', distance: '12 mi', score: 90 },
];

const chatRows = ['Sophia', 'Faith', 'Gigi', 'Yvette', 'Maria', 'Channelle', 'Empress'];

const navSections = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Home', icon: Home },
      { name: 'Explore', icon: Search },
      { name: 'Matches', icon: Heart },
    ],
  },
  {
    title: 'Connections',
    items: [
      { name: 'Likes Received', icon: Heart },
      { name: 'Likes Sent', icon: UserCheck },
      { name: 'Favorites', icon: Star },
      { name: 'Profile Visitors', icon: Eye },
    ],
  },
  {
    title: 'Communication',
    items: [
      { name: 'Messages', icon: MessageCircle, badge: 5 },
      { name: 'Voice Connect', icon: Mic },
      { name: 'Video Dating', icon: Video },
      { name: 'Date Requests', icon: CalendarDays },
    ],
  },
  {
    title: 'Discovery',
    items: [
      { name: 'Nearby Singles', icon: MapPin },
      { name: 'Smart Match AI', icon: Sparkles },
      { name: 'Events & Meetups', icon: Users },
    ],
  },
  {
    title: 'Profile',
    items: [
      { name: 'Verification Center', icon: BadgeCheck },
      { name: 'Profile Analytics', icon: BarChart3 },
      { name: 'Date Planner', icon: CalendarDays },
    ],
  },
  {
    title: 'Premium',
    items: [
      { name: 'Subscription', icon: Crown },
      { name: 'Boost Profile', icon: Sparkles },
      { name: 'Spotlight', icon: Trophy },
    ],
  },
  {
    title: 'Safety',
    items: [
      { name: 'Safety Center', icon: ShieldCheck },
      { name: 'Report & Block', icon: ShieldCheck },
      { name: 'Privacy Controls', icon: Lock },
    ],
  },
  {
    title: 'Rewards',
    items: [
      { name: 'Rewards Center', icon: Gift },
      { name: 'Referrals', icon: Gift },
      { name: 'Badges', icon: BadgeCheck },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', icon: Bell },
      { name: 'Settings', icon: Settings },
      { name: 'Help & Support', icon: HelpCircle },
    ],
  },
];

const pageMeta = {
  Home: { kind: 'dashboard', eyebrow: 'Command center', title: 'Home', summary: 'A high-trust launchpad for activity, discovery, and conversion.' },
  Explore: { kind: 'discovery', eyebrow: 'Discovery runway', title: 'Explore', summary: 'Browse high-intent profiles with premium visual treatment.' },
  Matches: { kind: 'gallery', eyebrow: 'Priority connections', title: 'Matches', summary: 'A focused queue of active, ready-to-connect members.' },
  'Likes Received': { kind: 'gallery', eyebrow: 'Incoming interest', title: 'Likes Received', summary: 'People already signal interest. Convert faster with clear actions.' },
  'Likes Sent': { kind: 'gallery', eyebrow: 'Outbound activity', title: 'Likes Sent', summary: 'Track sent likes, response rate, and follow-up opportunities.' },
  Favorites: { kind: 'gallery', eyebrow: 'Saved shortlist', title: 'Favorites', summary: 'Keep a curated list of the profiles worth revisiting.' },
  'Profile Visitors': { kind: 'analytics', eyebrow: 'Visitor analytics', title: 'Profile Visitors', summary: 'See who viewed your profile and what attention looks like over time.' },
  Messages: { kind: 'communication', eyebrow: 'Realtime inbox', title: 'Messages', summary: 'Built for active conversations, fast replies, and message control.' },
  'Voice Connect': { kind: 'communication', eyebrow: 'Audio-first dating', title: 'Voice Connect', summary: 'Short, low-friction voice calls before moving to video.' },
  'Video Dating': { kind: 'communication', eyebrow: 'Face-to-face screen', title: 'Video Dating', summary: 'Verified video sessions with polished scheduling and safety cues.' },
  'Date Requests': { kind: 'planner', eyebrow: 'Invitation queue', title: 'Date Requests', summary: 'Review, accept, or decline date requests from one clean queue.' },
  'Nearby Singles': { kind: 'map', eyebrow: 'Location-aware discovery', title: 'Nearby Singles', summary: 'Privacy-first local discovery with range and intent controls.' },
  'Smart Match AI': { kind: 'ai', eyebrow: 'Compatibility engine', title: 'Smart Match AI', summary: 'Explain why a match works using values, goals, and style signals.' },
  'Events & Meetups': { kind: 'events', eyebrow: 'Real-world conversion', title: 'Events & Meetups', summary: 'Curated social events that turn online intent into real interactions.' },
  'Verification Center': { kind: 'verification', eyebrow: 'Trust workflow', title: 'Verification Center', summary: 'A banking-style identity flow with clear trust milestones.' },
  'Profile Analytics': { kind: 'analytics', eyebrow: 'Performance insights', title: 'Profile Analytics', summary: 'Track impressions, engagement, and conversion from profile views.' },
  'Date Planner': { kind: 'planner', eyebrow: 'Planning studio', title: 'Date Planner', summary: 'Build date ideas, time blocks, and follow-up actions in one place.' },
  Subscription: { kind: 'premium', eyebrow: 'Monetization', title: 'Subscription', summary: 'Plan selection, feature access, and premium positioning.' },
  'Boost Profile': { kind: 'premium', eyebrow: 'Visibility boost', title: 'Boost Profile', summary: 'Increase exposure for a limited time with a clear lift summary.' },
  Spotlight: { kind: 'premium', eyebrow: 'Premium placement', title: 'Spotlight', summary: 'Feature a profile in premium slots with performance tracking.' },
  'Safety Center': { kind: 'safety', eyebrow: 'Safety dashboard', title: 'Safety Center', summary: 'Monitor risk signals, user actions, and personal safety controls.' },
  'Report & Block': { kind: 'safety', eyebrow: 'Moderation actions', title: 'Report & Block', summary: 'Fast, visible moderation flows that keep the community safer.' },
  'Privacy Controls': { kind: 'safety', eyebrow: 'Privacy controls', title: 'Privacy Controls', summary: 'Adjust visibility, discovery, and communication permissions.' },
  'Rewards Center': { kind: 'rewards', eyebrow: 'Rewards dashboard', title: 'Rewards Center', summary: 'A clean landing space for rewards, streaks, and milestone progress.' },
  Referrals: { kind: 'rewards', eyebrow: 'Growth loop', title: 'Referrals', summary: 'Track invites, signups, and reward balance over time.' },
  Badges: { kind: 'rewards', eyebrow: 'Achievement layer', title: 'Badges', summary: 'Social proof and milestone badges that encourage profile completion.' },
  Notifications: { kind: 'system', eyebrow: 'Activity stream', title: 'Notifications', summary: 'Realtime alerts, unread state, and engagement prompts.' },
  Settings: { kind: 'system', eyebrow: 'Control panel', title: 'Settings', summary: 'Personalize your experience with clear system controls.' },
  'Help & Support': { kind: 'system', eyebrow: 'Assistance center', title: 'Help & Support', summary: 'Find answers, submit a request, or escalate an issue quickly.' },
};

function Avatar({ name, online = false }) {
  return (
    <div className="avatar">
      {name.slice(0, 1).toUpperCase()}
      <span className={`status ${online ? 'live' : ''}`} />
    </div>
  );
}

function Sidebar({ page, setPage, open, setOpen }) {
  return (
    <>
      <div className={`sidebarBackdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="logo">D</div>
          <div>
            <b>DateBuk</b>
            <span>Industrial pages pack</span>
          </div>
        </div>
        {navSections.map((group) => (
          <div className="group" key={group.title}>
            <p>{group.title}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setPage(item.name);
                    setOpen(false);
                  }}
                  className={page === item.name ? 'active' : ''}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                  {item.badge ? <em>{item.badge}</em> : null}
                </button>
              );
            })}
          </div>
        ))}
      </aside>
    </>
  );
}

function Header({ page, meta, onOpenSidebar }) {
  return (
    <header className="top">
      <div className="topCopy">
        <button className="mobileMenuButton" onClick={onOpenSidebar} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.summary}</p>
        </div>
      </div>
      <div className="tools">
        <div className="searchBox">
          <Search size={18} />
          <input placeholder={`Search ${page.toLowerCase()}, members, events...`} />
        </div>
        <button className="iconButton"><Bell size={18} /></button>
        <button className="iconButton"><Settings size={18} /></button>
      </div>
    </header>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="metricCard">
      <div className="metricIcon">{icon}</div>
      <div className="metricValue">{value}</div>
      <div className="metricLabel">{label}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      {(title || subtitle) && (
        <div className="panelHead">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
      )}
      <div className="panelBody">{children}</div>
    </section>
  );
}

function ProfileCard({ person, action = 'Connect' }) {
  return (
    <div className="profileCard">
      <Avatar name={person.name} online={person.online} />
      <h3>{person.name}</h3>
      <p><Star size={14} /> {person.score}% Match</p>
      <span>{person.city}</span>
      <button>{action}</button>
    </div>
  );
}

function DashboardPage({ meta }) {
  return (
    <>
      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
          <div className="heroActions">
            <button>Launch Feature</button>
            <button className="ghost">View Details</button>
          </div>
        </div>
        <Panel title="Activity Trend" subtitle="Engagement and conversion over the last week">
          <div className="chartCard">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend}>
                <XAxis dataKey="d" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#ec4899" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="metricGrid">
        <Stat icon="❤️" label="New likes" value="128" />
        <Stat icon="👀" label="Profile visits" value="2.4k" />
        <Stat icon="💬" label="Conversations" value="86" />
        <Stat icon="🛡️" label="Trust score" value="98%" />
      </div>

      <Panel title="Featured Profiles" subtitle="A quick look at the highest-intent members">
        <div className="profileGrid">
          {people.map((person) => (
            <ProfileCard key={person.name} person={person} />
          ))}
        </div>
      </Panel>
    </>
  );
}

function GalleryPage({ meta }) {
  return (
    <>
      <div className="sectionHead">
        <div>
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
        </div>
        <button>Filter Matches</button>
      </div>
      <div className="pillRow">
        {['Fresh', 'Top Rated', 'Nearby', 'Verified'].map((pill) => (
          <span className="pill" key={pill}>{pill}</span>
        ))}
      </div>
      <div className="profileGrid">
        {people.map((person) => (
          <ProfileCard key={`${meta.title}-${person.name}`} person={person} action={meta.title === 'Favorites' ? 'Open' : 'Connect'} />
        ))}
      </div>
    </>
  );
}

function AnalyticsPage({ meta, page }) {
  const visitors = page === 'Profile Visitors';

  return (
    <>
      <div className="metricGrid">
        <Stat icon="📈" label={visitors ? 'Today' : 'Impressions'} value={visitors ? '25' : '12.4k'} />
        <Stat icon="🧭" label={visitors ? 'This week' : 'CTR'} value={visitors ? '142' : '7.8%'} />
        <Stat icon="🌍" label={visitors ? 'Top city' : 'Matches'} value={visitors ? 'Lagos' : '386'} />
        <Stat icon="🎯" label={visitors ? 'Return visits' : 'Conversion'} value={visitors ? '41%' : '23%'} />
      </div>

      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
        </div>
        <Panel title={visitors ? 'Visitor count' : 'Profile performance'} subtitle={visitors ? 'People checking your profile' : 'Impressions and match yield'}>
          <div className="chartCard">
            <ResponsiveContainer width="100%" height={visitors ? 220 : 200}>
              {visitors ? (
                <BarChart data={trend}>
                  <XAxis dataKey="d" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="v" fill="#a855f7" radius={[12, 12, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={trend}>
                  <XAxis dataKey="d" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#ec4899" strokeWidth={3} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="funnel">
        <div>Views</div>
        <ChevronRight />
        <div>Likes</div>
        <ChevronRight />
        <div>Matches</div>
        <ChevronRight />
        <div>Messages</div>
        <ChevronRight />
        <div>Dates</div>
      </div>

      <Panel title="Insight Summary" subtitle="Use these cues to tune your profile">
        <div className="listGrid">
          <div className="listRow">✓ Stronger engagement on weekend evenings</div>
          <div className="listRow">✓ Verified profiles convert faster in the top 20%</div>
          <div className="listRow">✓ Add a clearer bio to improve response rate</div>
        </div>
      </Panel>
    </>
  );
}

function VerificationPage({ meta }) {
  const steps = ['Email Verified', 'Phone Verified', 'Selfie Verified', 'Government ID Verified', 'Address Verified'];

  return (
    <>
      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
          <div className="heroActions">
            <button>Start Verification</button>
            <button className="ghost">Learn More</button>
          </div>
        </div>
        <Panel title="Trust Score" subtitle="Verification unlocks safer interaction">
          <div className="trustScore">
            <Radar size={34} />
            <strong>85%</strong>
            <span>High confidence profile</span>
          </div>
        </Panel>
      </div>

      <div className="checkList">
        {steps.map((step, index) => (
          <div className="checkItem" key={step}>
            <div>
              <BadgeCheck size={18} />
              <span>{step}</span>
            </div>
            <b>{index < 3 ? 'Complete' : 'Pending'}</b>
          </div>
        ))}
      </div>

      <div className="uploadGrid">
        <Panel title="Government ID" subtitle="Upload both front and back for review">
          <div className="dropZone">Upload Front / Back</div>
        </Panel>
        <Panel title="Live Selfie" subtitle="Complete liveness detection in one tap">
          <div className="dropZone">Start Liveness Check</div>
        </Panel>
      </div>
    </>
  );
}

function AIPage({ meta }) {
  return (
    <>
      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
          <div className="heroActions">
            <button>Generate AI Explanation</button>
            <button className="ghost">Compare Matches</button>
          </div>
        </div>
        <Panel title="Compatibility Radar" subtitle="A clean explanation of why this pairing works">
          <div className="chartCard">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="k" />
                <RadarSeries dataKey="v" fill="#ec4899" fillOpacity={0.35} stroke="#7c3aed" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="explainGrid">
        <div className="listRow">✓ Similar long-term relationship goals</div>
        <div className="listRow">✓ Strong overlap in lifestyle and values</div>
        <div className="listRow">✓ Compatible communication preferences</div>
      </div>
    </>
  );
}

function DiscoveryPage({ meta }) {
  return (
    <>
      <div className="mapCard">
        <MapPin size={44} />
        <h2>{meta.title}</h2>
        <p>{meta.summary}</p>
        <div className="pillRow center">
          {['5 mi', '10 mi', '25 mi', '50 mi'].map((radius) => (
            <span className="pill" key={radius}>{radius}</span>
          ))}
        </div>
      </div>

      <div className="profileGrid">
        {nearbyPeople.map((person, index) => (
          <div className="profileCard mapProfile" key={person.name}>
            <Avatar name={person.name} online={index % 2 === 0} />
            <h3>{person.name}</h3>
            <p><Star size={14} /> {person.score}% Match</p>
            <span>{person.distance} away</span>
            <button>View Profile</button>
          </div>
        ))}
      </div>
    </>
  );
}

function PlannerPage({ meta, page }) {
  const dateRequests = page === 'Date Requests';

  return (
    <>
      <div className="plannerGrid">
        <Panel title={dateRequests ? 'Request Queue' : 'Upcoming Dates'} subtitle={dateRequests ? 'Review invitations in order of urgency' : 'Your best next meetups'}>
          <div className="timeline">
            {(dateRequests
              ? ['Coffee invite — Today 7:00 PM', 'Museum walk — Friday 5:30 PM', 'Video date — Sunday 8:00 PM']
              : ['Coffee date — Today 7:00 PM', 'Museum walk — Friday 5:30 PM', 'Video date — Sunday 8:00 PM']
            ).map((item) => (
              <div className="timelineRow" key={item}>{item}</div>
            ))}
          </div>
        </Panel>

        <Panel title={dateRequests ? 'Actions' : 'AI Date Ideas'} subtitle={dateRequests ? 'Approve, decline, or reschedule' : 'Suggestions based on shared interests'}>
          <div className="timeline">
            {(dateRequests
              ? ['Accept request', 'Ask for more details', 'Suggest a new time', 'Save for later']
              : ['Quiet coffee shop', 'Art gallery', 'Public park walk', 'Restaurant with verified reviews']
            ).map((item) => (
              <div className="timelineRow" key={item}>{item}</div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function CommunicationPage({ meta, page }) {
  const isVoice = page === 'Voice Connect';
  const isVideo = page === 'Video Dating';

  return (
    <>
      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
          <div className="heroActions">
            <button>{isVoice ? 'Start Voice Room' : isVideo ? 'Schedule Video Date' : 'Open Inbox'}</button>
            <button className="ghost">Safety Settings</button>
          </div>
        </div>
        <Panel title={isVoice ? 'Call Preview' : isVideo ? 'Video Lounge' : 'Realtime Inbox'} subtitle="A polished communication shell">
          <div className="listGrid">
            <div className="listRow">{isVoice ? '7 min intro call' : isVideo ? 'Verified 1:1 session' : 'Unread messages prioritized'}</div>
            <div className="listRow">{isVoice ? 'Noise suppression enabled' : isVideo ? 'Quality and moderation cues' : 'Pinned threads stay on top'}</div>
            <div className="listRow">{isVoice ? 'Tap-to-call flow' : isVideo ? 'One-tap join link' : 'Attachments and retries supported'}</div>
          </div>
        </Panel>
      </div>

      <div className="communicationGrid">
        <Panel title="People online" subtitle="Open a conversation or start a call">
          <div className="chatRows">
            {chatRows.map((name, index) => (
              <div className="chatRow" key={name}>
                <Avatar name={name} online={index % 2 === 0} />
                <div className="chatMeta">
                  <b>{name}</b>
                  <span>{isVoice ? 'Ready for voice chat' : isVideo ? 'Ready for video' : 'Last message preview'}</span>
                </div>
                <em>{index === 4 ? '11' : '00'}</em>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={isVoice ? 'Voice actions' : isVideo ? 'Video actions' : 'Message actions'} subtitle="Fast controls for common tasks">
          <div className="pillRow wrap">
            {(isVoice ? ['Call now', 'Schedule', 'Mute', 'Report'] : isVideo ? ['Join call', 'Schedule', 'Share link', 'Report'] : ['Reply', 'Archive', 'Pin', 'Mute']).map((item) => (
              <span className="pill" key={item}>{item}</span>
            ))}
          </div>
          <div className="timeline" style={{ marginTop: 14 }}>
            <div className="timelineRow">Next recommended match response in under 2 hours</div>
            <div className="timelineRow">Conversation safety tools always visible</div>
            <div className="timelineRow">Message delivery and retry status shown clearly</div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function PremiumPage({ meta }) {
  return (
    <>
      <div className="metricGrid">
        <Stat icon="💎" label="Current tier" value="Premium" />
        <Stat icon="🚀" label="Boost lift" value="+34%" />
        <Stat icon="🌟" label="Spotlight views" value="8.2k" />
        <Stat icon="💸" label="Revenue unlocked" value="$1.2k" />
      </div>

      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
          <div className="heroActions">
            <button>Upgrade Plan</button>
            <button className="ghost">View Comparison</button>
          </div>
        </div>
        <Panel title="Plan Options" subtitle="Subscription and visibility tools">
          <div className="listGrid">
            <div className="listRow">Premium - $9.99/month</div>
            <div className="listRow">Elite - $19.99/month</div>
            <div className="listRow">Boost Profile - temporary visibility lift</div>
          </div>
        </Panel>
      </div>

      <div className="premiumGrid">
        {['Premium access', 'Boosted visibility', 'Spotlight slots', 'Priority support'].map((item) => (
          <Panel key={item} title={item} subtitle="Included or upgradeable">
            <div className="timelineRow">Activate from your subscription center.</div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function SafetyPage({ meta, page }) {
  return (
    <>
      <div className="metricGrid">
        <Stat icon="🛡️" label="Safety score" value="98%" />
        <Stat icon="🚫" label="Blocked users" value="4" />
        <Stat icon="📋" label="Reports reviewed" value="12" />
        <Stat icon="🔒" label="Privacy flags" value="1" />
      </div>

      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
          <div className="heroActions">
            <button>{page === 'Report & Block' ? 'Report User' : page === 'Privacy Controls' ? 'Open Privacy Panel' : 'Open Safety Tools'}</button>
            <button className="ghost">Emergency Contact</button>
          </div>
        </div>
        <Panel title="Protection Controls" subtitle="Community safety and account privacy">
          <div className="listGrid">
            <div className="listRow">Manage blocked users</div>
            <div className="listRow">Review recent reports</div>
            <div className="listRow">Toggle discovery visibility</div>
          </div>
        </Panel>
      </div>

      <div className="settingsList">
        {['Report User', 'Manage Blocked Users', 'Emergency Contact', 'Privacy Controls'].map((item) => (
          <button key={item}>{item}</button>
        ))}
      </div>
    </>
  );
}

function EventsPage({ meta }) {
  return (
    <>
      <div className="sectionHead">
        <div>
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
        </div>
        <button>Create / Join</button>
      </div>

      <div className="premiumGrid">
        {['Singles Mixer', 'Speed Dating', 'Book Lovers', 'Fitness Meetup', 'Daily Rewards', 'Referral Bonus'].map((name) => (
          <Panel key={name} title={name} subtitle="Curated DateBuk module with premium CTA">
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>Balanced social discovery with trust signals, attendance tracking, and a clean conversion path.</p>
            <button style={{ marginTop: 16 }}>Open</button>
          </Panel>
        ))}
      </div>
    </>
  );
}

function RewardsPage({ meta, page }) {
  const cards = page === 'Badges'
    ? ['Verified Member', 'Conversation Starter', 'Streak Keeper', 'Community Builder']
    : page === 'Referrals'
      ? ['Invite Link', 'Signup Count', 'Reward Balance', 'Payout Status']
      : ['Daily Check-In', 'Referral Bonus', 'Milestones', 'Store Credit'];

  return (
    <>
      <div className="metricGrid">
        <Stat icon="🎁" label="Rewards balance" value="$48" />
        <Stat icon="🔥" label="Current streak" value="12 days" />
        <Stat icon="👥" label="Invites" value="26" />
        <Stat icon="🏆" label="Badge level" value="Gold" />
      </div>

      <div className="hero">
        <div className="heroText">
          <span className="tag">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.summary}</p>
          <div className="heroActions">
            <button>Claim Reward</button>
            <button className="ghost">Share Invite</button>
          </div>
        </div>
        <Panel title="Progress" subtitle="A quick snapshot of reward activity">
          <div className="listGrid">
            <div className="listRow">Streak bonus unlocked this week</div>
            <div className="listRow">Referral conversions trending up</div>
            <div className="listRow">New badge opportunity ready</div>
          </div>
        </Panel>
      </div>

      <div className="premiumGrid">
        {cards.map((item) => (
          <Panel key={item} title={item} subtitle="Reward and incentive module">
            <div className="timelineRow">Earned actions and status shown clearly.</div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function SystemPage({ meta, page }) {
  if (page === 'Settings') {
    return (
      <>
        <div className="settingsList">
          {['Notification preferences', 'Privacy defaults', 'Account security', 'Billing options'].map((item) => (
            <button key={item}>{item}</button>
          ))}
        </div>
      </>
    );
  }

  if (page === 'Help & Support') {
    return (
      <>
        <Panel title="Help Center" subtitle="Common questions and support shortcuts">
          <div className="listGrid">
            <div className="listRow">How do matches work?</div>
            <div className="listRow">How to verify my account?</div>
            <div className="listRow">How to report a user?</div>
          </div>
        </Panel>
        <div className="settingsList" style={{ marginTop: 16 }}>
          <button>Contact Support</button>
          <button>Open Ticket</button>
          <button>Live Chat</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="metricGrid">
        <Stat icon="🔔" label="Unread" value="18" />
        <Stat icon="✅" label="Resolved" value="92%" />
        <Stat icon="⚙️" label="System status" value="Live" />
        <Stat icon="💡" label="Tips" value="3" />
      </div>

      <Panel title={meta.title} subtitle={meta.summary}>
        <div className="listGrid">
          <div className="listRow">New match alerts</div>
          <div className="listRow">Message delivery status</div>
          <div className="listRow">Billing and feature updates</div>
        </div>
      </Panel>
    </>
  );
}

function App() {
  const [page, setPage] = useState('Matches');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meta = useMemo(
    () =>
      pageMeta[page] || {
        kind: 'dashboard',
        eyebrow: 'Feature page',
        title: page,
        summary: 'Industrial feature page ready for further implementation.',
      },
    [page],
  );

  const Page = useMemo(() => {
    switch (meta.kind) {
      case 'dashboard':
        return DashboardPage;
      case 'discovery':
      case 'map':
        return DiscoveryPage;
      case 'gallery':
        return GalleryPage;
      case 'analytics':
        return AnalyticsPage;
      case 'verification':
        return VerificationPage;
      case 'ai':
        return AIPage;
      case 'planner':
        return PlannerPage;
      case 'communication':
        return CommunicationPage;
      case 'premium':
        return PremiumPage;
      case 'safety':
        return SafetyPage;
      case 'events':
        return EventsPage;
      case 'rewards':
        return RewardsPage;
      case 'system':
        return SystemPage;
      default:
        return DashboardPage;
    }
  }, [meta.kind]);

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />

      <main>
        <Header page={page} meta={meta} onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="pageShell">
          <Page meta={meta} page={page} />
        </div>
      </main>

      <aside className="chat">
        <div className="chatHead">
          <h2>Real-Time Chat</h2>
          <p>Active now</p>
        </div>
        {chatRows.map((name, index) => (
          <div className="chatRow" key={name}>
            <Avatar name={name} online={index % 2 === 0} />
            <div className="chatMeta">
              <b>{name}</b>
              <span>Last message preview</span>
            </div>
            <em>{index === 4 ? '11' : '00'}</em>
          </div>
        ))}
        <div className="chatComposer">
          <input placeholder="Send a quick reply..." />
          <button><Send size={16} /></button>
        </div>
      </aside>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
