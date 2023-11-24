import './style.css'
import { Channels } from '@phenixrts/sdk'

const videoElement = document.getElementsByTagName('video')[0] as HTMLVideoElement
const token =
  'DIGEST:eyJhcHBsaWNhdGlvbklkIjoicGhlbml4cnRzLmNvbS1hbGV4Lnppbm4iLCJkaWdlc3QiOiIvdkxRK0RkOWkzNU02c0JnRTBsMWVuUnZrdzBWOWkwSVYxcDFpbFhTYkVMSnhxbUVzaytFZzFyc0xtKzQ0a0pteVdLdzJ5dHJ1ejVWWFM4bnhBbDhPQT09IiwidG9rZW4iOiJ7XCJleHBpcmVzXCI6MTcwMjM5NzI4OTQzNixcInVyaVwiOlwiaHR0cHM6Ly9wY2FzdC1zdGcucGhlbml4cnRzLmNvbVwiLFwiY2FwYWJpbGl0aWVzXCI6W1wiZW5jb2RlZC1pbnNlcnRhYmxlLXN0cmVhbXNcIl0sXCJyZXF1aXJlZFRhZ1wiOlwiY2hhbm5lbElkOnVzLWNlbnRyYWwjcGhlbml4cnRzLmNvbS1hbGV4Lnppbm4jdGVzdENoYW5uZWwyLnhLbjM5Vk51a3BjblwifSJ9'
const chunks: ArrayBuffer[] = []
let chunkCount = 0

const channel = Channels.createChannel({
  token,
  videoElement,
  encodedAudioStreamSink: (track, chunk) => {
    return true
  },
  encodedVideoStreamSink: (track, chunk) => {
    if (chunks.length > 180) {
      return true
    }

    saveArrayBufferToFile(new Uint8Array(chunk.data).slice(), `chunk-${chunkCount++}`)

    return false
  }
})

async function disconnectAndSave() {
  console.log('Disposing of channel')
  await channel.dispose()

  console.log('Writing File')
  while (chunks.length) {
    const chunk = chunks.shift()

    saveArrayBufferToFile(chunk, `chunk-[${chunkCount++}]`)
  }
}

function saveArrayBufferToFile(arrayBuffer, fileName) {
  console.log('Storing chunk [%o]', fileName)

  // Create a Blob from the ArrayBuffer
  const blob = new Blob([arrayBuffer])

  // Create a link element
  const link = document.createElement('a')

  // Set the href attribute of the link to a Blob URL
  link.href = URL.createObjectURL(blob)

  // Set the download attribute to the desired file name
  link.download = fileName + '.bin'

  // Append the link to the document
  document.body.appendChild(link)

  // Trigger a click on the link to start the download
  link.click()

  // Remove the link from the document
  document.body.removeChild(link)
}
