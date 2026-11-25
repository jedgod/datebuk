import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useDateBukCall } from '../hooks/useDateBukCall';

type Props={selfId:string;peerId:string;callId:string;media:'voice'|'video';incoming?:boolean;onClose:()=>void};
export default function CallScreen({selfId,peerId,callId,media,incoming,onClose}:Props){
 const call=useDateBukCall(selfId);
 React.useEffect(()=>{ if(!incoming) call.startCall(peerId,callId,media); },[]);
 const accept=async()=>{const pending=(globalThis as any).__DATEBUK_PENDING_OFFER__;await call.acceptCall(peerId,callId,media,pending?.sdp)};
 const hang=()=>{call.endCall();onClose()};
 return <SafeAreaView style={s.root}>
   {media==='video' && call.remoteStream ? <RTCView style={s.remote} streamURL={call.remoteStream.toURL()} objectFit="cover"/> : <View style={s.avatar}><Text style={s.initial}>{peerId.slice(0,1).toUpperCase()}</Text></View>}
   {media==='video' && call.localStream && <RTCView style={s.local} streamURL={call.localStream.toURL()} mirror objectFit="cover"/>}
   <View style={s.meta}><Text style={s.name}>{peerId}</Text><Text style={s.status}>{incoming&&call.status==='ringing'?'Incoming call':call.status}</Text></View>
   {incoming&&call.status==='ringing'?<View style={s.controls}><Btn label="Decline" onPress={hang}/><Btn label="Accept" onPress={accept}/></View>:
   <View style={s.controls}><Btn label={call.muted?'Unmute':'Mute'} onPress={call.toggleMute}/>{media==='video'&&<Btn label={call.cameraEnabled?'Camera off':'Camera on'} onPress={call.toggleCamera}/>}<Btn label="End" onPress={hang}/></View>}
 </SafeAreaView>
}
function Btn({label,onPress}:{label:string;onPress:()=>void}){return <Pressable accessibilityRole="button" onPress={onPress} style={s.btn}><Text style={s.btnText}>{label}</Text></Pressable>}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#090B12',alignItems:'center',justifyContent:'center'},remote:{...StyleSheet.absoluteFillObject},local:{position:'absolute',right:18,top:60,width:110,height:160,borderRadius:18},avatar:{width:130,height:130,borderRadius:65,backgroundColor:'#7C3AED',alignItems:'center',justifyContent:'center'},initial:{fontSize:54,color:'white',fontWeight:'800'},meta:{position:'absolute',top:90,alignItems:'center'},name:{color:'white',fontSize:27,fontWeight:'800'},status:{color:'#CBD5E1',marginTop:8,textTransform:'capitalize'},controls:{position:'absolute',bottom:55,flexDirection:'row',gap:16},btn:{minWidth:88,paddingVertical:16,paddingHorizontal:18,borderRadius:32,backgroundColor:'rgba(255,255,255,.16)',alignItems:'center'},btnText:{color:'white',fontWeight:'700'}});
