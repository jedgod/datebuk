import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { subscriptionsService, PlanTier } from '../services/subscriptions';

interface SubscriptionScreenProps {
  navigation: any;
}

const PLANS: { id: PlanTier; name: string; price: string; features: string[] }[] = [
  { id: 'FREE', name: 'Free', price: '$0', features: ['10 likes per day', 'Basic matching'] },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '$14.99/mo',
    features: ['Unlimited likes', 'Chat & voice calls', 'Advanced filters'],
  },
  {
    id: 'ELITE',
    name: 'Elite',
    price: '$29.99/mo',
    features: ['Everything in Premium', 'Video calls', 'Priority visibility'],
  },
];

export default function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
  const [currentPlan, setCurrentPlan] = useState<PlanTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanTier | null>(null);

  const loadPlan = useCallback(async () => {
    try {
      const data = await subscriptionsService.getCurrentPlan();
      setCurrentPlan(data.plan);
    } catch (error) {
      console.error('Failed to load subscription plan:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Re-check the plan whenever this screen regains focus — e.g. after the
  // user returns from the in-app Stripe Checkout browser sheet.
  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

  const handleUpgrade = async (plan: 'PREMIUM' | 'ELITE') => {
    setUpgrading(plan);
    try {
      await subscriptionsService.startCheckout(plan);
      await loadPlan();
    } catch (error: any) {
      Alert.alert('Upgrade Failed', error?.message || 'Could not start checkout');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>Upgrade anytime, cancel anytime</Text>

      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const canUpgrade = plan.id !== 'FREE' && !isCurrent;

        return (
          <View key={plan.id} style={[styles.card, isCurrent && styles.cardCurrent]}>
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            {plan.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.featureDot}>•</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}

            {isCurrent ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            ) : canUpgrade ? (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => handleUpgrade(plan.id as 'PREMIUM' | 'ELITE')}
                disabled={upgrading !== null}
              >
                {upgrading === plan.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.upgradeButtonText}>Upgrade to {plan.name}</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCurrent: {
    borderColor: '#EC4899',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureDot: {
    color: '#EC4899',
    marginRight: 8,
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#444',
  },
  currentBadge: {
    marginTop: 12,
    backgroundColor: '#fce7f3',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  currentBadgeText: {
    color: '#EC4899',
    fontWeight: '700',
  },
  upgradeButton: {
    marginTop: 12,
    backgroundColor: '#EC4899',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  backButton: {
    marginTop: 8,
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 15,
  },
});
