export enum SupportedKeySystem {
  Clearkey = 'org.w3.clearkey',
  Widevine = 'com.widevine.alpha'
}
export interface MediaKeyConfigurationType {
  'org.w3.clearkey': {
    keyIds: Record<string, string>;
    mediaKeysSystemConfig: MediaKeySystemConfiguration;
  }
}

export default function configureMediaKeysFor(mediaElement: HTMLMediaElement, selectedSystem: string, config: MediaKeyConfigurationType[typeof selectedSystem]) {
  if (!mediaElement.mediaKeys) {
    console.log('[step 1] request MediaKeys System Access');
    navigator
      .requestMediaKeySystemAccess(selectedSystem, [config.mediaKeysSystemConfig])
      .then(mediaKeySystemAccess => {
        console.log('[step 2] create media keys with mediaKeysSystemAccess');
        return mediaKeySystemAccess.createMediaKeys();
      })
      .then(async mediaKeys => {
        console.log('[step 3] set mediaKeys [%o] on media Element', mediaKeys);
        await mediaElement.setMediaKeys(mediaKeys);

        return mediaKeys;
      })
      .catch(error => console.warn('Error requesting Media Key System Access [%o]', error))
      .then(mediaKeys => {
        console.log('[step 4] use mediaKeys to create session');
        if (!mediaKeys) {
          throw new Error('No Media Keys');
        }

        return mediaKeys.createSession();
      })
      .then(keySession => {
        const te = new TextEncoder();
        const initData = te.encode(`{"kids":["${Object.keys((config as MediaKeyConfigurationType[SupportedKeySystem.Clearkey]).keyIds ?? {})[0]}"]}`);
        console.log('[step 5] use keySession to "generateRequest"');
        keySession?.generateRequest('keyids', initData);

        const onKeySessionMessage = ({messageType, message}: MediaKeySessionEventMap['message']) => {
          console.log('[step 7] onKeySessionMessage -> fetch license with payload');
          console.log('[onKeySessionMessage] messageType [%o] message [%o]', messageType, message);
          const keyIds = Object.entries((config as MediaKeyConfigurationType[SupportedKeySystem.Clearkey]).keyIds);

          const license = te.encode(`{"keys":[{"kty":"oct","k":"${keyIds[0][1]}","kid":"${keyIds[0][0]}"}],"type":"temporary"}`);
          keySession?.update(license).catch(console.error.bind(console, 'update() failed'));
        };

        if (onKeySessionMessage) {
          console.log('[step 6] set "message" event listener on KeySession');
          keySession?.addEventListener('message', onKeySessionMessage);
        }
      });
  }
}