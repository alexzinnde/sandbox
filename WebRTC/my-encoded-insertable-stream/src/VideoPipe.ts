export default class VideoPipe {
  id: string
  pc1: RTCPeerConnection;
  pc2: RTCPeerConnection;

  constructor(id: string, stream: MediaStream, forceSend: boolean, forceReceive: boolean, handler: (ev: RTCTrackEvent) => void) {
    this.id = id;
    this.pc1 = new RTCPeerConnection({
      encodedInsertableStreams: forceSend
    });
    this.pc2 = new RTCPeerConnection({
      encodedInsertableStreams: forceReceive
    });

    stream.getTracks().forEach(track => this.pc1.addTrack(track, stream));
    this.pc2.ontrack = handler;
  }

  async negotiate() {
    console.log('[VideoPipe] [%s] negotiating...', this.id)
    this.pc1.onicecandidate = e => this.pc2.addIceCandidate(e.candidate);
    this.pc2.onicecandidate = e => this.pc1.addIceCandidate(e.candidate);

    const offer = await this.pc1.createOffer();
    await this.pc2.setRemoteDescription({type: 'offer', sdp: offer.sdp.replace('red/90000', 'green/90000')});
    await this.pc1.setLocalDescription(offer);

    const answer = await this.pc2.createAnswer();
    await this.pc1.setRemoteDescription(answer);
    await this.pc2.setLocalDescription(answer);

    console.log('[VideoPipe] [%s] Negotiation Complete', this.id)
  }

  close() {
    this.pc1.close();
    this.pc2.close();
  }
}
