import './style.css';

import MseDecoder from './mseDecoder/decoder/MseDecoder';
import configureMediaKeysClearKey from './mseDecoder/mediaKeys/configureMediaKeysClearKey';
import configureMediaKeysFor from './mseDecoder/mediaKeys/configureMediaKeys';

const root = document.querySelector('#app');
const demoSources = {
  'isobmff-unencrypted': {
    path: '/Phenix-ISO-BMFF-20s-H264-unencrypted/test-mp4.%Number$',
    segmentDuration: 33
  },
  'dash-unencrypted': {
    initData: '/dash-segments/720init.mp4',
    path: '/dash-segments/720-%Number$.m4s',
    segmentDuration: 1800
  },
  'isobmff-clearkey': {
    initData: '/ISO-BMFF-clearkey/720init.mp4',
    path: '/ISO-BMFF-clearkey/seg-%Number$.m4s',
    segmentDuration: 33,
    drm: {
      keySystem: 'org.w3.clearkey',
      systemConfiguration: {
        keyIds: {
          KioqKioqKioqKioqKioqKg: 'AQIDBAUGBwgJCgsMDQ4PEA'
        },
        mediaKeysSystemConfig: {
          initDataTypes: ['cenc'],
          videoCapabilities: [{contentType: 'video/mp4; codecs="avc1.42C015"'}]
        }
      }
    }
  },
  'platform-widevine': {
    initData: 'https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/720-init.mp4',
    path: 'https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/720-%Number$.m4s',
    segmentDuration: 1800,
    drm: {
      keySystem: 'com.widevine.alpha',
      serverCertificateUrl: `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
      licenseServerUrl: `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/license?drmtoken=%drmtoken$`,
      mediaKeySystemConfiguration: {
        initDataTypes: ['cenc'],
        videoCapabilities: [{contentType: 'video/mp4; codecs="avc1.42E01E"'}],
        audioCapabilities: [{contentType: 'audio/mp4; codecs="mp4a.40.2"'}],
        persistentState: 'required',
        distinctiveIdentifier: 'optional'
      }
    }
  }
};

let mseDecoder: MseDecoder;

const videoContainer = document.createElement('div');
const videoElement = document.createElement('video');
videoElement.style.width = '360px';
videoElement.style.height = '270px';
videoElement.style.backgroundColor = 'black';
videoContainer.appendChild(videoElement);

videoElement.onwaitingforkey = (...args) => {
  console.log('[video] Waiting For Keys [%o]', ...args);
};

const demoSelectContainer = document.createElement('div');
const demoSourceSelectLabel = document.createElement('label');
demoSourceSelectLabel.innerText = 'Select Source: ';
demoSourceSelectLabel.htmlFor = 'demo-source';
const demoSourceSelect = document.createElement('select');
demoSourceSelect.id = 'demo-source';
Object.keys(demoSources).forEach(demoSource => {
  const option = document.createElement('option');
  option.innerText = demoSource;
  option.value = demoSource;

  demoSourceSelect.appendChild(option);
});

demoSelectContainer.appendChild(demoSourceSelectLabel);
demoSelectContainer.appendChild(demoSourceSelect);

const buttonsContainer = document.createElement('div');
const toggleFeeder = document.createElement('button');
toggleFeeder.innerText = 'Start';

const feedInvalidBtn = document.createElement('button');
feedInvalidBtn.innerText = 'Feed Invalid';
feedInvalidBtn.style.backgroundColor = 'red';
feedInvalidBtn.onclick = () => {
  const invalidData = new Uint8Array([0xff, 0xff, 0xff]);
  mseDecoder.trackWriters['video'](invalidData);
};
buttonsContainer.appendChild(toggleFeeder);
buttonsContainer.appendChild(feedInvalidBtn);

const platfromDRMContainer = document.createElement('div');
const applicationIdInput = document.createElement('input');
applicationIdInput.type = 'text';
applicationIdInput.placeholder = 'Application Id';
applicationIdInput.value = 'phenixrts.com-alex.zinn';
const streamIdInput = document.createElement('input');
streamIdInput.type = 'text';
streamIdInput.placeholder = 'Stream Id';
streamIdInput.value = 'us-central#us-chicago-1-ad-1.95NF3RLW.20230710.PSlQPrJe';

const drmTokenInput = document.createElement('input');
drmTokenInput.type = 'text';
drmTokenInput.placeholder = 'DRM Token';
platfromDRMContainer.appendChild(document.createElement('br'));
platfromDRMContainer.appendChild(applicationIdInput);
platfromDRMContainer.appendChild(document.createElement('br'));
platfromDRMContainer.appendChild(streamIdInput);
platfromDRMContainer.appendChild(document.createElement('br'));
platfromDRMContainer.appendChild(drmTokenInput);

demoSourceSelect.onchange = () => {
  const selectedDemoName = demoSourceSelect.selectedOptions[0].label;
  if (selectedDemoName === 'platform-widevine') {
    demoSelectContainer.appendChild(platfromDRMContainer);
  }
};

let feederInterval: number;
let dataId = 0;

toggleFeeder.onclick = async () => {
  const selectedDemoName = demoSourceSelect.selectedOptions[0].label;
  const selectedDemo = demoSources[selectedDemoName];

  if (selectedDemoName === 'platform-widevine') {
    const applicationId = applicationIdInput.value;
    const streamId = streamIdInput.value;
    const drmToken = drmTokenInput.value;

    selectedDemo.drm.serverCertificateUrl = selectedDemo.drm.serverCertificateUrl.replace('%applicationId$', encodeURIComponent(applicationId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.drm.serverCertificateUrl = selectedDemo.drm.serverCertificateUrl.replace('%streamId$', encodeURIComponent(streamId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.drm.licenseServerUrl = selectedDemo.drm.licenseServerUrl.replace('%applicationId$', encodeURIComponent(applicationId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.drm.licenseServerUrl = selectedDemo.drm.licenseServerUrl.replace('%streamId$', encodeURIComponent(streamId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.drm.licenseServerUrl = selectedDemo.drm.licenseServerUrl.replace('%drmtoken$', encodeURIComponent(drmToken)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.initData = selectedDemo.initData.replace('%applicationId$', encodeURIComponent(applicationId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.initData = selectedDemo.initData.replace('%streamId$', encodeURIComponent(streamId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.path = selectedDemo.path.replace('%applicationId$', encodeURIComponent(applicationId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
    selectedDemo.path = selectedDemo.path.replace('%streamId$', encodeURIComponent(streamId)); // `https://pcast-stg.phenixrts.com/video/%applicationId$/%streamId$/widevine/certificate`,
  }

  mseDecoder = new MseDecoder({
    mediaElement: videoElement,
    options: {
      sourceBufferMode: 'segments'
    }
  });

  mseDecoder.addTrack('video/mp4; codecs="avc1.42E01E"');

  if (selectedDemo.drm?.keySystem === 'com.widevine.alpha') {
    await configureMediaKeysFor(videoElement, selectedDemo.drm);
  }

  if (selectedDemo.drm?.keySystem === 'org.w3.clearkey') {
    configureMediaKeysClearKey(videoElement, 'org.w3.clearkey', selectedDemo.drm.systemConfiguration);
  }

  if (feederInterval) {
    clearInterval(feederInterval);
    feederInterval = 0;
    toggleFeeder.innerText = 'Start';
  } else {
    selectedDemoName === 'platform-widevine' ? (dataId = 1) : (dataId = 0);
    if (selectedDemo.initData) {
      const initData = await fetchSegmentAt(selectedDemo.initData);
      const statusInit = await mseDecoder.trackWriters['video'](initData);
      console.log('init feed Status [%s]', statusInit);
    }
    feederInterval = setInterval(async () => {
      const segmentUrl =
        selectedDemoName === 'platform-widevine' ? selectedDemo.path.replace('%Number$', padStringWithZeros(dataId.toString(), 5)) : selectedDemo.path.replace('%Number$', dataId);
      const data = await fetchSegmentAt(segmentUrl);
      const statusVideo = await mseDecoder.trackWriters['video'](data);
      if (statusVideo === 'ERROR') {
        dataId = 0;
      } else {
        dataId += 1;
        if (dataId > 600) {
          dataId = 0;
        }
      }
      console.log('Status [video] [%s]', statusVideo);
    }, selectedDemo.segmentDuration);

    if (videoElement.paused) {
      videoElement.play();
    }
    toggleFeeder.innerText = 'Stop';
  }
};

async function fetchSegmentAt(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

root?.appendChild(videoContainer);
root?.appendChild(document.createElement('br'));
root?.appendChild(demoSelectContainer);
root?.appendChild(document.createElement('br'));
root?.appendChild(buttonsContainer);

export function padStringWithZeros(str: string, targetLength = 5) {
  const strArr = str.split('');

  while (strArr.length < targetLength) {
    strArr.unshift('0');
  }

  return strArr.join('');
}
