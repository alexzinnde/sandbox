enum SupportedDRMProviders {
  ClearKey = 'org.w3.clearkey'
}

export type EncryptedMediaHandlerConfigType = {
  selectedKeySystem: SupportedDRMProviders;
  mediaKeysSystemConfiguration: MediaKeySystemConfiguration;
  serverCertificateUrl?: string;
  licenseServerUrl?: string;
  keySessionType?: MediaKeySessionType;
};
export default class EncryptedMediaHandler {
  public isInitialized: boolean;
  private _selectedKeySystem: SupportedDRMProviders;
  private _mediaKeysSystemConfiguration: MediaKeySystemConfiguration;
  private _serverCertificateUrl?: string;
  private _licenseServerUrl?: string;
  private _keySessionType?: MediaKeySessionType;
  private _mediaKeys?: MediaKeys;
  private _keySession?: MediaKeySession;

  constructor({
    selectedKeySystem,
    mediaKeysSystemConfiguration,
    serverCertificateUrl,
    licenseServerUrl,
    keySessionType
  }: EncryptedMediaHandlerConfigType) {
    this.isInitialized = false;
    this._selectedKeySystem = selectedKeySystem;
    this._mediaKeysSystemConfiguration = mediaKeysSystemConfiguration;
    this._serverCertificateUrl = serverCertificateUrl;
    this._licenseServerUrl = licenseServerUrl;
    this._keySessionType = keySessionType ?? 'temporary';

    this._initialize().then(() => (this.isInitialized = true));
  }

  public configureMediaElement(mediaElement: HTMLMediaElement): void {
    this._setMediaKeysOnMediaElement(mediaElement);
    this._setOnVideoEncryptedEventListener(mediaElement);
  }

  private async _initialize() {
    await navigator
      .requestMediaKeySystemAccess(this._selectedKeySystem, [this._mediaKeysSystemConfiguration])
      .then(mediaKeysSystemAccess => mediaKeysSystemAccess.createMediaKeys())
      .then((mediaKeys: MediaKeys) => {
        if (!mediaKeys) {
          throw new Error(`Media Keys not available for the selected DRM Providor [${this._selectedKeySystem}]`);
        }

        if (this._serverCertificateUrl) {
          fetch(this._serverCertificateUrl)
            .then(res => res.arrayBuffer())
            .then((serverCertificate: ArrayBuffer) => mediaKeys.setServerCertificate(serverCertificate))
            .catch(setServerCertificateError => console.error(`Error setting server certifcate [${setServerCertificateError}]`));
        }
        const onMediaKeysMessage = ({messageType, message}: MediaKeyMessageEvent) => {
          console.log('[EncryptedMediaHandler] MediaKeys Message Type [%s]', messageType)
          // !?!?!?!?!
          
        }

        this._keySession = mediaKeys.createSession('temporary');
        this._keySession?.addEventListener('message', onMediaKeysMessage.bind(this))
        


        this._mediaKeys = mediaKeys;
      });
  }

  private _setMediaKeysOnMediaElement(mediaElement: HTMLMediaElement) {
    if (!this._mediaKeys) {
      console.warn('Cannot set mediaKeys on mediaElement [%o]', this._mediaKeys);
      return;
    }

    mediaElement.setMediaKeys(this._mediaKeys);
  }

  private _setOnVideoEncryptedEventListener(mediaElement: HTMLMediaElement) {
    mediaElement.addEventListener('encypted', this._onVideoEncrypted.bind(this) as EventListener);
  }

  private _onVideoEncrypted(mediaEvent: MediaEncryptedEvent) {
    const {initDataType, initData} = mediaEvent;

    if (!this._keySession) {
      return console.warn('No KeySession');
    }

    this._keySession.generateRequest(initDataType, initData ?? new ArrayBuffer(0));
  }
}
