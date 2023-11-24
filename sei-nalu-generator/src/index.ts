const seiType = 3
const seiSizeInBytes = 288
const annexBStartCode = new Uint8Array([0x00, 0x00, 0x00, 0x01])

function generateSeiFillerDataNalUnit(seiSizeInBytes: number): Uint8Array {
  const data = [0x00, 0x00, 0x00, 0x01, 0x06, 0x03]

  let ffCount = 0
  for (ffCount; ffCount < Math.floor(seiSizeInBytes / 255); ffCount++) {
    data.push(0xff)
  }

  const remainder = seiSizeInBytes % 255
  data.push(parseInt(remainder.toString(16)))

  ffCount = 0
  for (ffCount; ffCount < seiSizeInBytes; ffCount++) {
    data.push(0xff)
  }

  data.push(0x80)
  data.push(...annexBStartCode)

  return new Uint8Array(data)
}

const seiFillerNalu = generateSeiFillerDataNalUnit(288)

console.log(seiFillerNalu)
