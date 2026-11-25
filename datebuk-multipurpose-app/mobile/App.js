import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const featureGroups = [
  {
    title: 'Dashboard',
    items: [
      ['Dashboard', 'Command center for profile activity, matches, messages and safety.', 'home-outline'],
      ['Explore', 'Browse high-intent profiles and discover nearby members.', 'search-outline'],
      ['Matches', 'Track active connections and next actions.', 'heart-outline'],
    ],
  },
  {
    title: 'Connections',
    items: [
      ['Likes Received', 'People who liked you with quick follow-up actions.', 'sparkles-outline'],
      ['Likes Sent', 'Outbound likes and pending requests.', 'send-outline'],
      ['Favorites', 'Saved profiles for later follow-up.', 'star-outline'],
      ['Profile Visitors', 'See who viewed your profile.', 'eye-outline'],
    ],
  },
  {
    title: 'Communication',
    items: [
      ['Messages', 'Realtime inbox and message controls.', 'chatbubble-outline'],
      ['Voice Connect', 'Low-friction voice-first introductions.', 'mic-outline'],
      ['Video Dating', 'Verified video sessions and scheduling.', 'videocam-outline'],
      ['Date Requests', 'Review, accept or decline date requests.', 'calendar-outline'],
    ],
  },
  {
    title: 'Discovery',
    items: [
      ['Nearby Singles', 'Distance-based discovery with filters.', 'location-outline'],
      ['Smart Match AI', 'Compatibility scoring and insights.', 'sparkles'],
      ['Events & Meetups', 'Local events and social meetups.', 'people-outline'],
    ],
  },
  {
    title: 'Profile',
    items: [
      ['My Profile', 'Edit photos, bio and preferences.', 'person-outline'],
      ['Verification Center', 'Trust and identity verification.', 'shield-checkmark-outline'],
      ['Profile Analytics', 'Views, likes and match rate.', 'stats-chart-outline'],
      ['Date Planner', 'Plan dates and availability.', 'calendar-number-outline'],
    ],
  },
  {
    title: 'Premium + Safety',
    items: [
      ['Premium', 'Upgrade tiers and visibility tools.', 'diamond-outline'],
      ['Safety Center', 'Privacy, reports and block controls.', 'shield-outline'],
      ['Rewards & Referrals', 'Rewards, badges and referrals.', 'gift-outline'],
      ['Settings', 'Notification and account settings.', 'settings-outline'],
      ['Help & Support', 'Support shortcuts and help flows.', 'help-circle-outline'],
    ],
  },
];

const featureStats = [
  { label: 'New likes', value: '128' },
  { label: 'Visits', value: '2.4k' },
  { label: 'Chats', value: '86' },
  { label: 'Trust', value: '98%' },
];

const featureSignals = ['Trust-first onboarding', 'Realtime messaging', 'Location-aware discovery', 'Premium conversion'];

const featuredPeople = [
  { name: 'Mausia', city: 'Lagos', score: 98, online: true },
  { name: 'Puril', city: 'Abuja', score: 94, online: false },
  { name: 'Purthex', city: 'Port Harcourt', score: 100, online: true },
  { name: 'Livek', city: 'Ibadan', score: 89, online: false },
  { name: 'Nagno', city: 'Enugu', score: 92, online: true },
  { name: 'Aplick', city: 'Lekki', score: 96, online: true },
];

const activityTrend = [42, 68, 51, 90, 112, 156, 138];

function iconFor(name) {
  const map = {
    Dashboard: 'home-outline',
    Explore: 'search-outline',
    Matches: 'heart-outline',
    'Likes Received': 'sparkles-outline',
    'Likes Sent': 'send-outline',
    Favorites: 'star-outline',
    'Profile Visitors': 'eye-outline',
    Messages: 'chatbubble-outline',
    'Voice Connect': 'mic-outline',
    'Video Dating': 'videocam-outline',
    'Date Requests': 'calendar-outline',
    'Nearby Singles': 'location-outline',
    'Smart Match AI': 'sparkles',
    'Events & Meetups': 'people-outline',
    'My Profile': 'person-outline',
    'Verification Center': 'shield-checkmark-outline',
    'Profile Analytics': 'stats-chart-outline',
    'Date Planner': 'calendar-number-outline',
    Premium: 'diamond-outline',
    'Safety Center': 'shield-outline',
    'Rewards & Referrals': 'gift-outline',
    Settings: 'settings-outline',
    'Help & Support': 'help-circle-outline',
  };

  return map[name] || 'ellipse-outline';
}

function FeatureCard({ name, description, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featureCard, selected && styles.featureCardSelected, pressed && styles.featureCardPressed]}>
      <Ionicons name={iconFor(name)} size={20} color={selected ? '#ffffff' : '#db2777'} />
      <Text style={[styles.featureCardTitle, selected && styles.featureCardTitleSelected]}>{name}</Text>
      <Text style={[styles.featureCardText, selected && styles.featureCardTextSelected]}>{description}</Text>
      <Text style={[styles.featureCardAction, selected && styles.featureCardActionSelected]}>Open module</Text>
    </Pressable>
  );
}

function SidebarDrawer({ active, setActive, open, setOpen }) {
  return (
    <>
      {open ? <Pressable style={styles.backdrop} onPress={() => setOpen(false)} /> : null}
      <View style={[styles.drawer, open && styles.drawerOpen]}>
        <View style={styles.drawerHeader}>
          <View style={styles.logo}><Text style={styles.logoText}>D</Text></View>
          <View>
            <Text style={styles.title}>DateBuk</Text>
            <Text style={styles.sub}>Multipurpose feature pack</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.drawerContent}>
          {featureGroups.map((group) => (
            <View key={group.title} style={styles.drawerGroup}>
              <Text style={styles.drawerGroupTitle}>{group.title}</Text>
              {group.items.map(([name]) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    setActive(name);
                    setOpen(false);
                  }}
                  style={[styles.drawerItem, active === name && styles.drawerItemActive]}
                >
                  <Text style={[styles.drawerItemText, active === name && styles.drawerItemTextActive]}>{name}</Text>
                  {['Matches', 'Messages', 'Likes Received'].includes(name) ? (
                    <Text style={styles.drawerBadge}>{name === 'Messages' ? 5 : 12}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

function SectionHeader({ title, description, onOpenMenu }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onOpenMenu} style={styles.menuButton}>
        <Ionicons name="menu" size={22} color="#101827" />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>Industrial mobile pages</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroText}>{description}</Text>
      </View>
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState('Dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeGroup = useMemo(() => featureGroups.find((group) => group.items.some(([name]) => name === active)) || featureGroups[0], [active]);
  const activeItem = activeGroup.items.find(([name]) => name === active) || activeGroup.items[0];
  const title = activeItem[0];
  const description = activeItem[1];

  return (
    <SafeAreaView style={styles.safe}>
      <SidebarDrawer active={active} setActive={setActive} open={drawerOpen} setOpen={setDrawerOpen} />

      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <SectionHeader
          title={title}
          description={description}
          onOpenMenu={() => setDrawerOpen(true)}
        />

        <View style={styles.metricsRow}>
          {featureStats.map((stat) => (
            <View key={stat.label} style={styles.metricCard}>
              <Text style={styles.metricValue}>{stat.value}</Text>
              <Text style={styles.metricLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroPanelText}>
            <Text style={styles.signalLabel}>{activeGroup.title}</Text>
            <Text style={styles.heroPanelTitle}>{title} page</Text>
            <Text style={styles.heroPanelCopy}>Mobile-first DateBuk screen for dating discovery, safety, communication, analytics and premium workflows.</Text>
            <View style={styles.actionRow}>
              <Pressable style={styles.primary}><Text style={styles.primaryText}>Open Action</Text></Pressable>
              <Pressable style={styles.secondary}><Text style={styles.secondaryText}>View Details</Text></Pressable>
            </View>
          </View>

          <View style={styles.trendPanel}>
            <Text style={styles.trendTitle}>Weekly activity</Text>
            <View style={styles.barRow}>
              {activityTrend.map((value, index) => (
                <View key={`${value}-${index}`} style={styles.barWrap}>
                  <View style={[styles.bar, { height: Math.max(18, Math.round((value / 160) * 120)) }]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.signalRow}>
          {featureSignals.map((signal) => (
            <View key={signal} style={styles.signalChip}><Text style={styles.signalChipText}>{signal}</Text></View>
          ))}
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Grouped modules</Text>
          <Text style={styles.sectionSubtitle}>{width < 768 ? 'Tap cards or open the menu' : 'Tap a grouped module below'}</Text>
        </View>

        <View style={styles.grid}>
          {activeGroup.items.map(([name, itemDescription]) => (
            <FeatureCard
              key={name}
              name={name}
              description={itemDescription}
              selected={active === name}
              onPress={() => setActive(name)}
            />
          ))}
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Featured profiles</Text>
          <Text style={styles.sectionSubtitle}>High-intent members ready for connection</Text>
        </View>

        <View style={styles.peopleGrid}>
          {featuredPeople.map((person) => (
            <View key={person.name} style={styles.personCard}>
              <View style={styles.personAvatar}><Text style={styles.personAvatarText}>{person.name.slice(0, 1)}</Text></View>
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personMeta}>{person.city}</Text>
              <Text style={styles.personScore}>{person.score}% Match</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff7fb',
  },
  page: {
    flex: 1,
  },
  pageContent: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffd1e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#be185d',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
    color: '#101827',
  },
  heroText: {
    fontSize: 15,
    color: '#667085',
    lineHeight: 22,
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 90,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd1e8',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#101827',
  },
  metricLabel: {
    color: '#667085',
    marginTop: 2,
  },
  heroPanel: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffd1e8',
    marginBottom: 14,
  },
  heroPanelText: {
    marginBottom: 18,
  },
  signalLabel: {
    color: '#be185d',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroPanelTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
    color: '#101827',
  },
  heroPanelCopy: {
    color: '#667085',
    lineHeight: 22,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  primary: {
    backgroundColor: '#db2777',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '900',
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#f9a8d4',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#be185d',
    fontWeight: '900',
  },
  trendPanel: {
    backgroundColor: '#fff7fb',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd1e8',
  },
  trendTitle: {
    fontWeight: '900',
    color: '#101827',
    marginBottom: 12,
  },
  barRow: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    maxWidth: 22,
    borderRadius: 999,
    backgroundColor: '#db2777',
  },
  signalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  signalChip: {
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffd1e8',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  signalChipText: {
    color: '#475467',
    fontWeight: '700',
  },
  sectionTitleRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#101827',
  },
  sectionSubtitle: {
    color: '#667085',
    marginTop: 4,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  featureCard: {
    width: '48%',
    minHeight: 160,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ffd1e8',
    padding: 16,
    justifyContent: 'space-between',
  },
  featureCardPressed: {
    opacity: 0.88,
  },
  featureCardSelected: {
    backgroundColor: '#db2777',
    borderColor: '#db2777',
  },
  featureCardTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '900',
    color: '#101827',
  },
  featureCardTitleSelected: {
    color: '#fff',
  },
  featureCardText: {
    marginTop: 8,
    color: '#667085',
    lineHeight: 20,
    flex: 1,
  },
  featureCardTextSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  featureCardAction: {
    color: '#be185d',
    fontWeight: '900',
    marginTop: 10,
  },
  featureCardActionSelected: {
    color: '#fff',
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  personCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffd1e8',
    padding: 16,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  personAvatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  personName: {
    fontWeight: '900',
    color: '#101827',
    fontSize: 16,
  },
  personMeta: {
    color: '#667085',
    marginTop: 4,
  },
  personScore: {
    color: '#be185d',
    fontWeight: '900',
    marginTop: 10,
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(16,24,39,0.45)',
    zIndex: 5,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '84%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderColor: '#ffd1e8',
    transform: [{ translateX: -400 }],
    zIndex: 10,
  },
  drawerOpen: {
    transform: [{ translateX: 0 }],
  },
  drawerHeader: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffd1e8',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#101827',
  },
  sub: {
    color: '#667085',
  },
  drawerContent: {
    padding: 16,
    paddingBottom: 30,
  },
  drawerGroup: {
    marginBottom: 18,
  },
  drawerGroupTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#98a2b3',
    fontWeight: '900',
    marginBottom: 8,
  },
  drawerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ffd1e8',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  drawerItemActive: {
    backgroundColor: '#fdf2f8',
    borderColor: '#f9a8d4',
  },
  drawerItemText: {
    color: '#475467',
    fontWeight: '700',
    flex: 1,
  },
  drawerItemTextActive: {
    color: '#be185d',
  },
  drawerBadge: {
    color: '#fff',
    backgroundColor: '#db2777',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
  },
});
