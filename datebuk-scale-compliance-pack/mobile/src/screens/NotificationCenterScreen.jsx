import React from 'react';
import { SafeAreaView, Text, View, StyleSheet } from 'react-native';

const items = ['New match nearby', 'Verification approved', 'Premium boost completed', 'Safety check reminder'];
export default function NotificationCenterScreen(){
 return <SafeAreaView style={styles.screen}><Text style={styles.title}>Notification Center</Text>{items.map(i=><View style={styles.card} key={i}><Text style={styles.item}>{i}</Text><Text style={styles.meta}>Just now · DateBuk</Text></View>)}</SafeAreaView>
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:'#f7f7fb',padding:18},title:{fontSize:30,fontWeight:'800',marginVertical:18},card:{backgroundColor:'#fff',borderRadius:18,padding:18,marginBottom:12},item:{fontSize:16,fontWeight:'700'},meta:{marginTop:6,color:'#64748b'}})
