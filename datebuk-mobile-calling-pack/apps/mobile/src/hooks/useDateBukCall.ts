import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaDevices, MediaStream, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { socket } from '../services/signaling';

type MediaKind = 'voice'|'video';
type Status = 'idle'|'ringing'|'connecting'|'connected'|'ended';
const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  ...(process.env.EXPO_PUBLIC_TURN_URL ? [{ urls: process.env.EXPO_PUBLIC_TURN_URL, username: process.env.EXPO_PUBLIC_TURN_USERNAME, credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL }] : [])
];

export function useDateBukCall(selfId: string) {
  const pc = useRef<RTCPeerConnection|null>(null);
  const peerId = useRef('');
  const activeCallId = useRef('');
  const [localStream,setLocalStream]=useState<MediaStream|null>(null);
  const [remoteStream,setRemoteStream]=useState<MediaStream|null>(null);
  const [status,setStatus]=useState<Status>('idle');
  const [muted,setMuted]=useState(false);
  const [cameraEnabled,setCameraEnabled]=useState(true);

  const createPeer = useCallback(() => {
    const connection = new RTCPeerConnection({ iceServers });
    connection.onicecandidate = e => e.candidate && socket.emit('webrtc:ice',{to:peerId.current,from:selfId,callId:activeCallId.current,candidate:e.candidate});
    connection.ontrack = e => e.streams?.[0] && setRemoteStream(e.streams[0]);
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'connected') setStatus('connected');
      if (['failed','closed','disconnected'].includes(connection.connectionState)) setStatus('ended');
    };
    pc.current=connection;
    return connection;
  },[selfId]);

  const getMedia = useCallback(async (media:MediaKind) => {
    const stream=await mediaDevices.getUserMedia({audio:true,video:media==='video'?{facingMode:'user',width:1280,height:720}:false});
    setLocalStream(stream);
    return stream;
  },[]);

  const startCall = useCallback(async (calleeId:string,callId:string,media:MediaKind) => {
    peerId.current=calleeId; activeCallId.current=callId; setStatus('connecting');
    const stream=await getMedia(media); const connection=createPeer();
    stream.getTracks().forEach(track=>connection.addTrack(track,stream));
    socket.emit('call:invite',{callerId:selfId,calleeId,callId,media});
    const offer=await connection.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:media==='video'});
    await connection.setLocalDescription(offer);
    socket.emit('webrtc:offer',{to:calleeId,from:selfId,callId,media,sdp:offer});
  },[createPeer,getMedia,selfId]);

  const acceptCall = useCallback(async (callerId:string,callId:string,media:MediaKind,offer?:any) => {
    peerId.current=callerId; activeCallId.current=callId; setStatus('connecting');
    const stream=await getMedia(media); const connection=createPeer();
    stream.getTracks().forEach(track=>connection.addTrack(track,stream));
    socket.emit('call:accept',{callerId,calleeId:selfId,callId,media});
    if (offer) {
      await connection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer=await connection.createAnswer(); await connection.setLocalDescription(answer);
      socket.emit('webrtc:answer',{to:callerId,from:selfId,callId,sdp:answer});
    }
  },[createPeer,getMedia,selfId]);

  const endCall=useCallback(()=>{
    socket.emit('call:end',{to:peerId.current,from:selfId,callId:activeCallId.current});
    pc.current?.close(); pc.current=null; localStream?.getTracks().forEach(t=>t.stop());
    setLocalStream(null); setRemoteStream(null); setStatus('ended');
  },[localStream,selfId]);

  useEffect(()=>{
    const onOffer=async (p:any)=>{ peerId.current=p.from; activeCallId.current=p.callId; (globalThis as any).__DATEBUK_PENDING_OFFER__=p; setStatus('ringing'); };
    const onAnswer=async(p:any)=>pc.current?.setRemoteDescription(new RTCSessionDescription(p.sdp));
    const onIce=async(p:any)=>pc.current?.addIceCandidate(new RTCIceCandidate(p.candidate));
    const onEnded=()=>endCall();
    socket.on('webrtc:offer',onOffer); socket.on('webrtc:answer',onAnswer); socket.on('webrtc:ice',onIce); socket.on('call:ended',onEnded);
    return()=>{socket.off('webrtc:offer',onOffer);socket.off('webrtc:answer',onAnswer);socket.off('webrtc:ice',onIce);socket.off('call:ended',onEnded)};
  },[endCall]);

  return {
    localStream,remoteStream,status,muted,cameraEnabled,startCall,acceptCall,endCall,
    toggleMute(){const next=!muted;localStream?.getAudioTracks().forEach(t=>t.enabled=!next);setMuted(next)},
    toggleCamera(){const next=!cameraEnabled;localStream?.getVideoTracks().forEach(t=>t.enabled=next);setCameraEnabled(next)},
    flipCamera(){localStream?.getVideoTracks().forEach((t:any)=>t._switchCamera?.())}
  };
}
