

export async function fetchSegmentAt(url: string) {
  const res = await fetch(url);
  return res.arrayBuffer()
}