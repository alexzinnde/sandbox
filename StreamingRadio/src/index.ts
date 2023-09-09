// @ts-ignore
import {OggVorbisDecoder} from '@wasm-audio-decoders/ogg-vorbis';
import https from 'https';

const decoder = new OggVorbisDecoder()
await decoder.ready;

const opusStreamUrl = 'https://icecast.techniker.me/main.ogg';

https.get(opusStreamUrl, {method: 'GET'}, res => {
  res.on('data', async(data: Buffer) => {
    const decodedData = await decoder.decode(new Uint8Array(data.buffer));
    console.log(decodedData)
  });
});
