import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';

const cards = [('Trust Score', '92/100'), ('Verification', '4/5'), ('Safety Alerts', '2'), ('Safe Dates', '3')];
const features = ['Video verification', 'Government ID review', 'Scam message flags', 'Safe date check-in', 'Blocked users', 'Admin safety queue'];

export default function TrustSafetyScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc', padding: 18 }}>
      <Text style={{ fontSize: 13, color: '#db2777', fontWeight: '800' }}>DateBuk Module</Text>
      <Text style={{ fontSize: 27, fontWeight: '900', marginTop: 6, color: '#0f172a' }}>Trust, Safety & Relationship Intelligence</Text>
      <Text style={{ marginTop: 8, color: '#475569', lineHeight: 21 }}>Adds trust score, verification, scam/catfish detection, safe date workflow, report/block, and admin safety operations.</Text>
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
