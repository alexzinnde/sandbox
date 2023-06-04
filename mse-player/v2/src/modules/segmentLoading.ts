/**
 * Copyright 2023 Phenix Real Time Solutions, Inc. Confidential and Proprietary. All Rights Reserved.
 */
export async function wait(seconds: number) {
  console.log('[demo] Waiting for [%s] seconds...', seconds);

  return new Promise(resolve => {
    setTimeout(() => resolve('Done waiting...'), seconds * 1000);
  });
}

export function padStringWithZeros(str: string, targetLength = 5) {
  const strArr = str.split('');

  while (strArr.length < targetLength) {
    strArr.unshift('0');
  }

  return strArr.join('');
}

export function generateChunkUrl(baseUri: string, chunkTemplateUri: string, chunkId: string, chunkIdLength: number): string {
  const chunkUrl = chunkTemplateUri.replace('$Number%', padStringWithZeros(chunkId, chunkIdLength));

  return `${baseUri}/${chunkUrl}`;
}

export async function fetchChunkAtUrl(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (response.status === 200) {
    return response.arrayBuffer();
  }

  return new ArrayBuffer(0);
}

export async function fetchChunkWithRetry(uri: string, chunkTemplateUri?: string, chunkId?: number, chunkIdLength = 5, attempt = 1, maxAttempt = 3): Promise<ArrayBuffer> {
  let chunkUrl: string;

  if (chunkTemplateUri && chunkId !== undefined) {
    chunkUrl = generateChunkUrl(uri, chunkTemplateUri, String(chunkId), chunkIdLength);
  } else {
    chunkUrl = uri;
  }

  const chunk = await fetchChunkAtUrl(chunkUrl);

  if (chunk instanceof ArrayBuffer && chunk.byteLength) {
    return chunk;
  }

  console.log('[demo] [fetchChunkWithRetry] Did not receive chunk. Attempt [%s] of [%s]', attempt, maxAttempt);

  if (attempt < maxAttempt) {
    const waitSeconds = Math.pow(2, 1 + attempt);

    console.log('[demo] [fetchChunkWithRetry] Waiting for [%s] seconds', waitSeconds);

    await wait(waitSeconds);

    return fetchChunkWithRetry(uri, chunkTemplateUri, chunkId, chunkIdLength, ++attempt);
  }

  console.log(`fetchChunk didn't get a receive a chunk at [%s] after [%s] attempts`, chunkUrl, attempt);

  return new ArrayBuffer(0);
}