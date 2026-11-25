import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SwipeCard from '../components/SwipeCard';
import { profileService } from '../services/profiles';
import { swipeService } from '../services/swipes';
import { Profile } from '../types';

export default function SwipeScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const recommendations = await profileService.getRecommendations();
      setProfiles(recommendations);
    } catch (error) {
      console.error('Error loading profiles:', error);
      Alert.alert('Error', 'Could not load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'dislike' | 'superlike') => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    try {
      const result = await swipeService.swipe({
        profileId: currentProfile.id,
        action,
      });

      if (result.match) {
        Alert.alert(
          '🎉 It\'s a Match!',
          `You and ${currentProfile.name} liked each other!`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      }

      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Load more profiles
        Alert.alert('No More Profiles', 'Check back later for more matches!');
        loadProfiles();
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error swiping:', error);
      Alert.alert('Error', 'Could not process swipe');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Finding matches...</Text>
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Profiles Available</Text>
        <Text style={styles.emptyText}>Check back later for more matches!</Text>
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>
          {currentIndex + 1} / {profiles.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {currentProfile && (
          <SwipeCard
            profile={currentProfile}
            onSwipeLeft={() => handleSwipe('dislike')}
            onSwipeRight={() => handleSwipe('like')}
            onSuperLike={() => handleSwipe('superlike')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
