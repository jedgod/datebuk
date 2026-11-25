import 'react-native-get-random-values';
import React from 'react';
import { Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import CallScreen from './src/screens/CallScreen';
import { connectSignaling, socket } from './src/services/signaling';
import { registerPushToken, showLocalIncomingCall } from './src/services/notifications';
import { displayIncomingNativeCall, setupCallKeep } from './src/services/callkeep';

export default function App(){
 const [selfId,setSelfId]=React.useState('user-alice'); const [peerId,setPeerId]=React.useState('user-bob');
 const [call,setCall]=React.useState<any>(null);
 React.useEffect(()=>{connectSignaling(selfId);setupCallKeep();registerPushToken(selfId).catch(console.warn);
   const incoming=(p:any)=>{showLocalIncomingCall(p.callerId,p.callId,p.media);displayIncomingNativeCall(p.callId,p.callerId,p.media==='video');setCall({selfId,peerId:p.callerId,callId:p.callId,media:p.media,incoming:true})};
   socket.on('call:incoming',incoming);return()=>{socket.off('call:incoming',incoming)};
 },[selfId]);
 if(call)return <CallScreen {...call} onClose={()=>setCall(null)}/>;
 const start=(media:'voice'|'video')=>setCall({selfId,peerId,callId:uuidv4(),media,incoming:false});
 return <SafeAreaView style={s.root}><View style={s.card}><Text style={s.title}>DateBuk Calls</Text><Text style={s.label}>Your user ID</Text><TextInput style={s.input} value={selfId} onChangeText={setSelfId}/><Text style={s.label}>Call user ID</Text><TextInput style={s.input} value={peerId} onChangeText={setPeerId}/><View style={s.actions}><Button title="Voice call" onPress={()=>start('voice')}/><Button title="Video call" onPress={()=>start('video')}/></View><Text style={s.note}>Use two devices and different user IDs.</Text></View></SafeAreaView>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#F3F4F6',justifyContent:'center',padding:20},card:{backgroundColor:'white',borderRadius:24,padding:24,gap:10},title:{fontSize:28,fontWeight:'900',marginBottom:14},label:{fontWeight:'700'},input:{borderWidth:1,borderColor:'#D1D5DB',borderRadius:12,padding:14},actions:{flexDirection:'row',justifyContent:'space-between',marginTop:12},note:{color:'#6B7280',marginTop:10}});
