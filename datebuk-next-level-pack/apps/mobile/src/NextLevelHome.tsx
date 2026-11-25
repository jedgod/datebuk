import React from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable } from 'react-native';

const modules = ['AI Match', 'Safety Center', 'Verification', 'Video Dating', 'Rewards', 'Support Desk'];

export default function NextLevelHome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: '#f9a8d4', fontWeight: '700' }}>DateBuk Mobile</Text>
        <Text style={{ color: 'white', fontSize: 30, fontWeight: '800', marginTop: 8 }}>Next-Level App Modules</Text>
        <Text style={{ color: '#cbd5e1', marginTop: 12 }}>Mobile-ready screens for trust, matching, chat, premium, rewards, and support workflows.</Text>
        {modules.map((m) => (
          <View key={m} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 18, marginTop: 16 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{m}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 6 }}>Industrial mobile landing screen with API-ready actions.</Text>
            <Pressable style={{ backgroundColor: '#ec4899', borderRadius: 12, padding: 12, marginTop: 12 }}>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Open</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
