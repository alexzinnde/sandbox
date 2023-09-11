import '../style.css';
import webSocketReadyStateMap from '../webSocketReadyStateMap';
import iceServers from '../iceServers';

const video = document.getElementById('video') as HTMLVideoElement;
const subscribeBtn = document.getElementById('subscribe-btn') as HTMLButtonElement;

const websocketStateDisplay = document.getElementById('web-socket-state') as HTMLInputElement;
const iceGatheringStateDisplay = document.getElementById('ice-gathering-state') as HTMLInputElement;
const iceConnectionStateDisplay = document.getElementById('ice-connection-state') as HTMLInputElement;
const connectionStateDisplay = document.getElementById('connection-state') as HTMLInputElement;
const signalingStateDisplay = document.getElementById('signaling-state') as HTMLInputElement;

const peerConnection = new RTCPeerConnection({iceServers: [iceServers]});

peerConnection.oniceconnectionstatechange = () => {
  iceConnectionStateDisplay.value = peerConnection.connectionState;
};
peerConnection.onconnectionstatechange = () => {
  connectionStateDisplay.value = peerConnection.connectionState;
};
peerConnection.onicegatheringstatechange = () => {
  iceGatheringStateDisplay.value = peerConnection.iceGatheringState;
};
peerConnection.onsignalingstatechange = () => {
  signalingStateDisplay.value = peerConnection.signalingState;
};
peerConnection.onnegotiationneeded = e => {
  console.log('[Subscriber] Negotiation Needed [%o]', e);
};
peerConnection.onicecandidate = async e => {
  console.log('[Subscriber] ice candidate [%o]', e.candidate);
  if (e.candidate) {
    await peerConnection.addIceCandidate(e.candidate);
  }
};
peerConnection.onicecandidateerror = e => {
  console.error('[Subscriber] Ice Candidate Error [%o]', e);
};

const ws = new WebSocket('ws://localhost:8888');
websocketStateDisplay.value = 'initializing';
ws.onerror = () => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];
};
ws.onopen = () => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];
};
ws.onclose = () => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];
};
ws.onmessage = message => {
  websocketStateDisplay.value = webSocketReadyStateMap[ws.readyState];

  const payload = JSON.parse(message.data);

  switch (payload.type) {
    case 'offer':
      return onReceiveOffer(payload);

    default:
      console.warn('[Subscriber] message unknown type [%o]', message);
  }
};

async function onReceiveOffer(offer: RTCSessionDescriptionInit) {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  peerConnection.ontrack = e => {
    if (!video.srcObject) {
      console.log('[Subscriber] setting video srcObject [%o]', e.streams[0]);
      video.srcObject = e.streams[0];
    }
  };

  ws.send(JSON.stringify(answer));
}
