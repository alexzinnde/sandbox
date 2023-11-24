import phenix from '@phenixrts/sdk';

const videoElement = document.getElementById('video-1') as HTMLVideoElement;

const token = 'DIGEST:eyJhcHBsaWNhdGlvbklkIjoicGhlbml4cnRzLmNvbS1hbGV4Lnppbm4iLCJkaWdlc3QiOiJURk80RFdEMStIaERWdnJsUEQxR3NyYnRmQmc5RGpGa2V0eGs1bWRUUjBLWUZsS3c1UkV4dmFHbVNZdWx4RVE2Mk5DUlBIeHdWVzA4RW93SUhkY3ZsUT09IiwidG9rZW4iOiJ7XCJleHBpcmVzXCI6MTY5ODg5Mzc3ODQ5NSxcInVyaVwiOlwiaHR0cHM6Ly9wY2FzdC1zdGcucGhlbml4cnRzLmNvbVwiLFwiY2FwYWJpbGl0aWVzXCI6W1wiZW5jb2RlZC1pbnNlcnRhYmxlLXN0cmVhbXNcIl0sXCJyZXF1aXJlZFRhZ1wiOlwiY2hhbm5lbElkOnVzLWNlbnRyYWwjcGhlbml4cnRzLmNvbS1hbGV4Lnppbm4jbXlDaGFubmVsQWxpYXMuZXVqY0hPb0VPNmJVXCJ9In0=';
const channelOptions = {
  token,
  videoElement,
  encodedAudioStreamSink:async (track, chunk) => Promise.resolve(true),
  ecodedVideoStreamSink: async (track, chunk) => {
    console.log('[video] chunk [%o]', chunk);
  }
}
let channel = phenix.Channels.createChannel(channelOptions);