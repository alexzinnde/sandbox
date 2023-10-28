import ExtractedNalUnit from './ExtractedNalUnit'

type ExtractedSeiPayload = ExtractedNalUnit & {
  seiPayloadType: number
  seiPayload: Uint8Array
}

export default ExtractedSeiPayload
