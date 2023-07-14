export async function fetchSegmentAt(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);

  return res.arrayBuffer();
}
