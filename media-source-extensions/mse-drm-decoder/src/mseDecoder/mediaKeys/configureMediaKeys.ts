export type MediaKeysConfigType = {
  keySystem: string;
  serverCertificateUrl: string;
  licenseServerUrl: string;
  mediaKeySystemConfiguration: MediaKeySystemConfiguration;
};

export default async function configureMediaKeysFor(mediaElement: HTMLMediaElement, config: MediaKeysConfigType) {
  const {keySystem, serverCertificateUrl, licenseServerUrl, mediaKeySystemConfiguration} = config;

  try {
    const mediaKeysSystemAccess = await navigator.requestMediaKeySystemAccess(keySystem, [mediaKeySystemConfiguration]);
    if (!mediaKeysSystemAccess) {
      throw new Error('No MediaKeySystem Access');
    }

    console.log('[configureMediaKeysFor] creating MediaKeys instance');
    const mediaKeys = await mediaKeysSystemAccess.createMediaKeys();

    console.log('[configureMediaKeysFor] setting MediaKeys on element');
    await mediaElement.setMediaKeys(mediaKeys);

    if (serverCertificateUrl) {
      console.log('[configureMediaKeysFor] fetching serverCertificate');
      const serverCertififate = await fetchServerCertificate(serverCertificateUrl);

      console.log('[configureMediaKeysFor] setting serverCertificate on MediaKeys');
      await mediaKeys.setServerCertificate(serverCertififate);
    }

    const onMediaEncrypted = async (event: MediaEncryptedEventInit) => {
      console.log('[onMediaEncryptedEvent] event [%o]', event);
      const {initDataType, initData} = event;
      const keySession = mediaKeys.createSession('temporary');
      const onKeySessionMessage = async ({message, target: keySession}: MediaKeyMessageEvent) => {
        console.log('[onKeySessionMessage] event [%o]', event);
        if (licenseServerUrl) {
          console.log('[onKeySessionMessage] fetching license from [%s] with message [%o]', licenseServerUrl, message);
          const license = await fetchLicense(licenseServerUrl, message);

          (keySession as MediaKeySession).update(license);
        }
      };

      keySession.addEventListener('message', onKeySessionMessage);
      await keySession.generateRequest(initDataType, initData);
      mediaElement.currentTime = mediaElement.currentTime + 2; //TODO WHY? get past init Segment
    };

    mediaElement.addEventListener('encrypted', onMediaEncrypted);
  } catch (error) {
    console.warn('Unable to configure Media Keys [%o]', error);
  }
}

async function fetchServerCertificate(serverCertificateUrl: string) {
  const response = await fetch(serverCertificateUrl, {method: 'GET'});

  return await response.arrayBuffer();
}

async function fetchLicense(licenseServerUrl: string, message: ArrayBuffer): Promise<Uint8Array> {
  const response = await fetch(licenseServerUrl, {
    method: 'POST',
    body: message,
    headers: {'Content-Type': 'application/octet-stream'}
  });
  const responseJSON = await response.json();
  const base64License = responseJSON.license;

  return base64ToBinary(base64License);
}

function base64ToBinary(bases64EncodedString: string): Uint8Array {
  const decodedString = atob(bases64EncodedString);
  const binaryData = new Uint8Array(decodedString.length);

  for (let i = 0; i < decodedString.length; ++i) {
    binaryData[i] = decodedString.charCodeAt(i);
  }

  return binaryData;
}
