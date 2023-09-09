import https from 'https';

export default function () {
  const streamUrl = 'https://icecast.techniker.me/main-opus.ogg';

  https.get(streamUrl, {method: 'GET'}, res => {
    res.on('data', (data: ArrayBuffer) => {
      console.log(data)
    });
  });
}
