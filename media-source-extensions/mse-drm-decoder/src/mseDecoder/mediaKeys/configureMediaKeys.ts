export enum SupportedKeySystem {
  Clearkey = 'org.w3.clearkey',
  Widevine = 'com.widevine.alpha'
}

export type MediaKeyConfigurationType = {
  selectedSystem: SupportedKeySystem;
  serverCertificateUrl?: string;
  licenseServerUrl?: string;
  systemConfiguration: MediaKeySystemConfiguration;
  clearkeyKeyIds?: Record<string, string>;
};
export default function configureMediaKeysFor(mediaElement: HTMLMediaElement, {selectedSystem, systemConfiguration, clearkeyKeyIds}: MediaKeyConfigurationType) {
  if (!mediaElement.mediaKeys) {
    console.log('[step 1] request MediaKeys System Access');
    navigator
      .requestMediaKeySystemAccess(selectedSystem, [systemConfiguration])
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
        const initData = te.encode(`{"kids":["${Object.keys(clearkeyKeyIds ?? {})[0]}"]}`);
        const keySession = mediaElement.mediaKeys?.createSession('temporary');
        console.log('[step 5] use keySession to "generateRequest"');
        keySession?.generateRequest('keyids', initData);

        const onKeySessionMessage = ({messageType, message}: MediaKeySessionEventMap['message']) => {
          console.log('[step 7] onKeySessionMessage -> fetch license with payload');
          console.log('[onKeySessionMessage] messageType [%o] message [%o]', messageType, message);
          const keyIds = Object.entries(clearkeyKeyIds ?? {});
          
          const license = te.encode(`{"keys":[{"kty":"oct","k":"${keyIds[0][1]}","kid":"${keyIds[0][0]}"}],"type":"temporary"}`);
          keySession?.update(license).catch(console.error.bind(console, 'update() failed'));
        };

        console.log('[step 6] set "message" event listener on KeySession');
        keySession?.addEventListener('message', onKeySessionMessage);
      });
  }
}
