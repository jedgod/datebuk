import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';

const cards = [('Communities', '230'), ('Events', '46'), ('Travel Matches', '19'), ('Market Listings', '81')];
const features = ['Dating mode', 'Friendship mode', 'Professional networking', 'Interest groups', 'Events and meetups', 'Travel connections'];

export default function GlobalSuperAppScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc', padding: 18 }}>
      <Text style={{ fontSize: 13, color: '#db2777', fontWeight: '800' }}>DateBuk Module</Text>
      <Text style={{ fontSize: 27, fontWeight: '900', marginTop: 6, color: '#0f172a' }}>Global Super-App Ecosystem</Text>
      <Text style={{ marginTop: 8, color: '#475569', lineHeight: 21 }}>Expands DateBuk into dating, friendship, communities, events, marketplace, travel connections, and professional networking.</Text>
      {cards.map(([label, value]) => (
        <View key={label} style={{ backgroundColor: 'white', borderRadius: 18, padding: 18, marginTop: 14 }}>
          <Text style={{ color: '#64748b' }}>{label}</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', marginTop: 4 }}>{value}</Text>
        </View>
      ))}
      <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 22 }}>Feature Controls</Text>
      {features.map(feature => (
        <View key={feature} style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '700', flex: 1 }}>{feature}</Text>
          <Text style={{ color: '#16a34a', fontWeight: '800' }}>ON</Text>
        </View>
      ))}
      <TouchableOpacity style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 26, marginTop: 22, marginBottom: 40 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Open Module</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
