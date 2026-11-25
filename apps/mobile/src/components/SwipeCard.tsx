import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Profile } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSuperLike: () => void;
}

export default function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onSuperLike,
}: SwipeCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {profile.photos && profile.photos.length > 0 ? (
            <Image source={{ uri: profile.photos[0] }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>
                {profile.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          {profile.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}, {profile.age || '?'}
            </Text>
          </View>
          
          {profile.location && (
            <Text style={styles.location}>📍 {profile.location}</Text>
          )}
          
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {profile.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, styles.buttonPass]} onPress={onSwipeLeft}>
          <Text style={styles.buttonIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonSuperLike]} onPress={onSuperLike}>
          <Text style={styles.buttonIcon}>★</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonLike]} onPress={onSwipeRight}>
          <Text style={styles.buttonIcon}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: 500,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 350,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 100,
    color: '#fff',
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 12,
    color: '#666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonPass: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  buttonSuperLike: {
    backgroundColor: '#3B82F6',
  },
  buttonLike: {
    backgroundColor: '#EC4899',
  },
  buttonIcon: {
    fontSize: 28,
    color: '#fff',
  },
});
