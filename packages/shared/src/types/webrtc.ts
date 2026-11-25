export type SignalingOffer = { to: string; offer: RTCSessionDescriptionInit };
export type SignalingAnswer = { to: string; answer: RTCSessionDescriptionInit };
export type SignalingIceCandidate = { to: string; candidate: RTCIceCandidateInit };
