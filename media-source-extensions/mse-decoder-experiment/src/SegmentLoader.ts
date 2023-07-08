

export async function fetchSegmentAt(url: string) {
  const data: Uint8Array[] = []
  const res = await fetch(url, { method: "GET" });
  const reader = res.body?.getReader();

  function onRead(reader: ReadableStreamBYOBReader, {done, value}) {
    if (done) {
      console.log('done [%s] data.length [%o]', data.length)
  
      return data.slice();
    }
  
    data.push(value);
  
    return reader.read().then(onRead.bind(null, reader))
    
  }

  return reader?.read().then(onRead.bind(null, reader));
}



