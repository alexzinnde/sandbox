import ExtractedNalUnit from './ExtractedNalUnit'
import ExtractedSeiPayload from './ExtractedSeiPayload'

export default class PhenixEmbeddedIsoBmff2023Extractor {
  private static readonly _annexBDelimiter: Uint8Array = new Uint8Array([0x00, 0x00, 0x00, 0x01])

  public static extractNextNalUnit(data: Uint8Array, offset: number): ExtractedNalUnit {
    const nalUnitType = data[offset + 4] & 0x1f
    // console.log('next NAL unit type [%o]', nalUnitType)

    switch (nalUnitType) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return this.extractVclNalUnit(nalUnitType, data, offset)

      default:
        return this.extractNonVclNalUnit(nalUnitType, data, offset)
    }
  }

  private static extractVclNalUnit(nalUnitType: number, data: Uint8Array, offset: number): ExtractedNalUnit {
    if (this.isDataAtOffsetAnnexBDelimiter(data, offset + 36)) {
      console.warn('Truncated VCL NAL unit')

      return {
        nalUnitType,
        nalUnit: data.subarray(offset + 4, offset + 36),
        endIndex: offset + 36
      }
    }

    if (this.isDataAtOffsetAnnexBDelimiter(data, offset + 20)) {
      console.warn('Truncated VCL NAL unit')

      return {
        nalUnitType,
        nalUnit: data.subarray(offset + 4, offset + 20),
        endIndex: offset + 20
      }
    }

    return {
      nalUnitType,
      nalUnit: data.subarray(offset + 4),
      endIndex: data.byteLength
    }
  }

  private static extractNonVclNalUnit(nalUnitType: number, data: Uint8Array, offset: number): ExtractedNalUnit {
    if (nalUnitType === 6) {
      return this.extractSeiPayload(data, offset)
    }

    const nextAnnexBDelimiterIndexFromOffset = this.findNextAnnexBDelimiterFromOffset(data, offset)

    return {
      nalUnitType,
      nalUnit: data.subarray(offset + 4, nextAnnexBDelimiterIndexFromOffset),
      endIndex: nextAnnexBDelimiterIndexFromOffset - 1
    }
  }

  private static extractSeiPayload(data: Uint8Array, offset: number): ExtractedSeiPayload {
    const seiPayloadType = data[offset + 5]
    let currentIndex = offset + 6

    while (data[currentIndex] === 0xff) {
      currentIndex++
    }

    const ffCount = currentIndex - offset - 6
    const payloadSize = ffCount * 255 + data[currentIndex]

    currentIndex++

    if (seiPayloadType === 3) {
      while (data[currentIndex] !== 0x80) {
        currentIndex++
      }

      return {
        nalUnitType: 6,
        nalUnit: data.subarray(offset + 4, offset + currentIndex),
        seiPayloadType,
        seiPayload: data.subarray(offset + 4, offset + currentIndex),
        endIndex: offset + currentIndex
      }
    }

    return {
      nalUnitType: 6,
      nalUnit: data.subarray(offset + 4, offset + payloadSize),
      seiPayloadType,
      seiPayload: data.subarray(currentIndex, currentIndex + payloadSize),
      endIndex: offset + payloadSize - 1
    }
  }

  private static isDataAtOffsetAnnexBDelimiter(data: Uint8Array, offset: number): boolean {
    return this._annexBDelimiter.every((annexBByte, annexBByteIndex) => data[offset + annexBByteIndex] === annexBByte)
  }

  private static findNextAnnexBDelimiterFromOffset(data: Uint8Array, offset: number): number {
    for (let index = offset + 1; index < data.byteLength - 3; index++) {
      if (this.isDataAtOffsetAnnexBDelimiter(data, index)) {
        return index
      }
    }

    return data.byteLength
  }

  private constructor() {
    throw new Error('PhenixEmbeddedIsoBmff2023Extractor is a static class that cannot be instantiated')
  }
}
