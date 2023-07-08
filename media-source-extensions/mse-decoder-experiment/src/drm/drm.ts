const demoClearKeys = ['KioqKioqKioqKioqKioqKg', 'AQIDBAUGBwgJCgsMDQ4PEA'];

export default function configureForClearKey(mediaElement: HTMLMediaElement) {
  if (!mediaElement.mediaKeys) {
    console.log('[step 1] request MediaKeys System Access');
    navigator
      .requestMediaKeySystemAccess('org.w3.clearkey', [
        {
          initDataTypes: ['webm'],
          videoCapabilities: [{contentType: 'video/mp4; codecs="avc1.42C015"'}]
        }
      ])
      .then(mediaKeySystemAccess => {
        console.log('[step 2] create media keys with mediaKeysSystemAccess');
        return mediaKeySystemAccess.createMediaKeys();
      })
      .then(mediaKeys => {
        console.log('[step 3] set mediaKeys on media Element');
        return mediaElement.setMediaKeys(mediaKeys);
      })
      .then(() => {
        console.log('[step 4] use mediaKeys to create session');
        const te = new TextEncoder();
        const initData = te.encode( '{"kids":["LwVHf8JLtPrv2GUXFW2v_A"]}');
        const keySession = mediaElement.mediaKeys?.createSession('temporary');
        console.log('[step 5] use keySession to "generateRequest"');
        keySession?.generateRequest('keyids', initData);

        const onKeySessionMessage = ({messageType, message}: MediaKeySessionEventMap['message']) => {
          console.log('[step 7] onKeySessionMessage -> fetch license with payload');
          console.log('[onKeySessionMessage] messageType [%o] message [%o]', messageType, message);

          const license = te.encode(`{"keys":[{"kty":"oct","k":"${demoClearKeys[1]}","kid":"${demoClearKeys[0]}"}],"type":"temporary"}`);
          keySession?.update(license).catch(console.error.bind(console, 'update() failed'));
        };

        console.log('[step 6] set "message" event listener on KeySession');
        keySession?.addEventListener('message', onKeySessionMessage);
      });
  }
}
