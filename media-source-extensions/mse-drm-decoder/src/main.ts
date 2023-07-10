import './style.css';

import MseDecoder from './mseDecoder/decoder/MseDecoder';
import {SupportedKeySystem} from './mseDecoder/mediaKeys/configureMediaKeys';

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
      selectedSystem: SupportedKeySystem.Clearkey,
      clearkeyKeyIds: {
        KioqKioqKioqKioqKioqKg: 'AQIDBAUGBwgJCgsMDQ4PEA'
      },
      systemConfiguration: {
        initDataTypes: ['webm'],
        videoCapabilities: [{contentType: 'video/mp4; codecs="avc1.42C015"'}]
      }
    }
  }
};

let mseDecoder: MseDecoder;

const videoElement = document.createElement('video');
videoElement.style.width = '360px';
videoElement.style.height = '270px';
videoElement.style.backgroundColor = 'black';

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

const toggleFeeder = document.createElement('button');
toggleFeeder.innerText = 'Start';

const feedInvalidBtn = document.createElement('button');
feedInvalidBtn.innerText = 'Feed Invalid';
feedInvalidBtn.style.backgroundColor = 'red';
feedInvalidBtn.onclick = () => {
  const invalidData = new Uint8Array([0xff, 0xff, 0xff]);
  mseDecoder.trackWriters['video'](invalidData);
};

let feederInterval: number;
let dataId = 0;

toggleFeeder.onclick = async () => {
  const selectedDemo = demoSources[demoSourceSelect.selectedOptions[0].value];

  mseDecoder = new MseDecoder({
    mediaElement: videoElement,
    options: {
      sourceBufferMode: 'sequence'
    },
    drm: selectedDemo.drm
  });
  mseDecoder.addTrack('video/mp4; codecs="avc1.42c01f"');

  if (feederInterval) {
    clearInterval(feederInterval);
    feederInterval = 0;
    toggleFeeder.innerText = 'Start';
  } else {
    if (selectedDemo.initData) {
      const initData = await fetchSegmentAt(selectedDemo.initData);
      const statusInit = await mseDecoder.trackWriters['video'](initData);
      console.log('init feed Status [%s]', statusInit);
    }
    feederInterval = setInterval(async () => {
      const segmentUrl = selectedDemo.path.replace('%Number$', dataId);
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

root?.appendChild(videoElement);
root?.appendChild(document.createElement('br'));
root?.appendChild(demoSourceSelectLabel);
root?.appendChild(demoSourceSelect);
root?.appendChild(document.createElement('br'));
root?.appendChild(toggleFeeder);
root?.appendChild(feedInvalidBtn);
