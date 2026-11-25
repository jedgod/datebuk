import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { enterpriseSections } from '../config/enterprise-sections';

interface EnterpriseHubScreenProps {
  navigation: any;
}

export default function EnterpriseHubScreen({ navigation }: EnterpriseHubScreenProps) {
  const [query, setQuery] = useState('');
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(
    new Set(['DASHBOARD', 'CONNECT'])
  );

  const normalizedQuery = query.trim().toLowerCase();

  const sections = useMemo(() => {
    if (!normalizedQuery) return enterpriseSections;
    return enterpriseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  const toggleSection = (title: string) => {
    setExpandedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handleFeaturePress = (item: { label: string; route?: 'Swipe' | 'Matches' | 'Profile' }) => {
    if (item.route) {
      navigation.navigate(item.route);
      return;
    }

    Alert.alert(item.label, 'This enterprise feature is queued for mobile rollout.');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FAE8FF', '#FCE7F3', '#FFF1F2']} style={styles.header}>
        <Text style={styles.title}>Enterprise Hub</Text>
        <Text style={styles.subtitle}>Grouped tools and advanced features now available on mobile</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search feature"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </LinearGradient>

      <FlatList
        data={sections}
        keyExtractor={(section) => section.title}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: section }) => {
          const expanded = expandedTitles.has(section.title) || Boolean(normalizedQuery);

          return (
            <View style={styles.sectionCard}>
              <Pressable
                onPress={() => toggleSection(section.title)}
                style={({ pressed }) => [styles.sectionHeader, pressed && styles.sectionHeaderPressed]}
              >
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionEmoji}>{section.emoji}</Text>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Text style={styles.sectionChevron}>{expanded ? '▾' : '▸'}</Text>
              </Pressable>

              {expanded ? (
                <View style={styles.itemsWrap}>
                  {section.items.map((feature) => (
                    <Pressable
                      key={`${section.title}-${feature.label}`}
                      style={({ pressed }) => [styles.itemRow, pressed && styles.itemRowPressed]}
                      onPress={() => handleFeaturePress(feature)}
                    >
                      <Text style={styles.itemEmoji}>{feature.emoji}</Text>
                      <Text style={styles.itemLabel}>{feature.label}</Text>
                      {feature.route ? <Text style={styles.itemRouteTag}>Open</Text> : <Text style={styles.itemRouteTagMuted}>Soon</Text>}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No feature found</Text>
            <Text style={styles.emptyStateText}>Try a different keyword.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FBCFE8',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F9A8D4',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  listContent: {
    padding: 14,
    gap: 10,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDF2F8',
  },
  sectionHeaderPressed: {
    opacity: 0.85,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#4B5563',
  },
  sectionChevron: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  itemsWrap: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  itemRow: {
    borderWidth: 1,
    borderColor: '#FCE7F3',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  itemRowPressed: {
    backgroundColor: '#FDF2F8',
  },
  itemEmoji: {
    fontSize: 16,
  },
  itemLabel: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  itemRouteTag: {
    color: '#BE185D',
    fontSize: 12,
    fontWeight: '700',
  },
  itemRouteTagMuted: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 50,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
