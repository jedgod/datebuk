import React, { useState } from 'react';
import { SafeAreaView, Text, View, Switch, Pressable, StyleSheet } from 'react-native';

export default function ConsentScreen() {
  const [accepted, setAccepted] = useState(false);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.kicker}>DateBuk Privacy</Text>
        <Text style={styles.title}>Consent & Safety Preferences</Text>
        <Text style={styles.body}>Control how DateBuk uses profile, location, analytics, and safety information.</Text>
        <View style={styles.row}><Text>Accept latest policy</Text><Switch value={accepted} onValueChange={setAccepted} /></View>
        <Pressable style={[styles.button, !accepted && styles.disabled]} disabled={!accepted}><Text style={styles.buttonText}>Save Consent</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#f7f7fb',padding:18},card:{backgroundColor:'#fff',borderRadius:24,padding:22,marginTop:24},kicker:{fontSize:12,letterSpacing:1.4,textTransform:'uppercase',color:'#7c3aed'},title:{fontSize:28,fontWeight:'800',marginTop:8},body:{fontSize:15,color:'#475569',marginVertical:16},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:14},button:{backgroundColor:'#7c3aed',padding:16,borderRadius:16,alignItems:'center',marginTop:16},disabled:{opacity:.4},buttonText:{color:'#fff',fontWeight:'700'}});
