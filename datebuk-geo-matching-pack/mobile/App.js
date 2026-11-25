import React from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';

export default function App(){
  return <ScrollView style={styles.screen} contentContainerStyle={styles.wrap}>
    <Text style={styles.badge}>DateBuk Geo-Matching</Text>
    <Text style={styles.title}>Regional Matches</Text>
    <Text style={styles.text}>Choose how DateBuk uses your approximate region to recommend matches.</Text>
    {['Nearby only','Same country','Same continent','Global mode','Travel mode'].map(x => <Pressable key={x} style={styles.card}><Text style={styles.cardText}>{x}</Text></Pressable>)}
  </ScrollView>
}
const styles=StyleSheet.create({screen:{backgroundColor:'#120817'},wrap:{padding:24},badge:{color:'#ff9aba',fontWeight:'800'},title:{fontSize:42,color:'#fff',fontWeight:'900',marginTop:16},text:{color:'#d8cce0',fontSize:16,marginVertical:14},card:{backgroundColor:'#24112d',borderRadius:20,padding:20,marginTop:14},cardText:{color:'#fff',fontSize:18,fontWeight:'800'}});
