import ExtractedNalUnit from './ExtractedNalUnit'
import ExtractedSeiPayload from './ExtractedSeiPayload'

interface IExtractor {
  extractNextNalUnit(data: Uint8Array, offset: number): ExtractedNalUnit | ExtractedSeiPayload
}

export default IExtractor
