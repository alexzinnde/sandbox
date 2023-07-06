export default class SegmentLoader {
  async getSegmentsAt(url: string) {
    const res = await fetch(url, { method: "GET" });
    const reader = res.body?.getReader();

    return reader?.read().then(onRead.bind(null, reader));
  }
}

const data: Uint8Array[] = []

function onRead(reader: ReadableStreamDefaultReader<Uint8Array> , {done, value}: {done: boolean, value: Uint8Array}) {
  if (done) {
    console.log('done [%s] data.length [%o]', data.length)

    return data.slice();
  }

  data.push(value);

  return reader.read().then(onRead.bind(null, reader))
  
}