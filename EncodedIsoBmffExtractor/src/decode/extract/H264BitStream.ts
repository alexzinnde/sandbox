import { Subject } from '@zinntechniker/subjectify'
import IDisposable from '@zinntechniker/subjectify/dist/types/IDisposable'
import IExtractor from './IExtractor'
import ExtractedNalUnit from './ExtractedNalUnit'
import ExtractedSeiPayload from './ExtractedSeiPayload'

export default class H264BitStream {
  private readonly _nalUnitEmitters: Record<number, Subject<Uint8Array>> = {}
  private readonly _seiPayloadEmitters: Record<number, Subject<Uint8Array>> = {}
  private readonly _extractor: IExtractor

  constructor(extractor: IExtractor) {
    this._extractor = extractor
  }

  public subscribeToNalUnitType(nalUnitType: number, listener: (nalUnit: Uint8Array) => void): IDisposable {
    if (!this._nalUnitEmitters[nalUnitType]) {
      this._nalUnitEmitters[nalUnitType] = new Subject<Uint8Array>(undefined)
    }

    return this._nalUnitEmitters[nalUnitType].subscribe(listener)
  }

  public subscribeToSeiPayloadType(seiPayloadType: number, listener: (seiPayload: Uint8Array) => void): IDisposable {
    if (!this._seiPayloadEmitters[seiPayloadType]) {
      this._seiPayloadEmitters[seiPayloadType] = new Subject<Uint8Array>(undefined)
    }

    return this._seiPayloadEmitters[seiPayloadType].subscribe(listener)
  }

  public extract(rawChunkData: ArrayBuffer): void {
    const chunkData = new Uint8Array(rawChunkData)
    let currentIndex = 0

    while (currentIndex < chunkData.byteLength) {
      const extractedData = this._extractor.extractNextNalUnit(chunkData, currentIndex)

      this.processExtractedData(extractedData)
      currentIndex = extractedData.endIndex + 1
    }

    // console.log('extract done endIndex [%o]', currentIndex)
  }

  private processExtractedData(extractedData: ExtractedNalUnit | ExtractedSeiPayload) {
    const { nalUnitType, nalUnit, seiPayloadType, seiPayload } = extractedData

    this.emitNalUnit(nalUnitType, nalUnit)

    if (nalUnitType === 6) {
      this.emitSeiPayload(seiPayloadType, seiPayload)
    }
  }

  private emitNalUnit(nalUnitType: number, nalUnit: Uint8Array): void {
    const nalUnitEmitter = this._nalUnitEmitters[nalUnitType]

    if (nalUnitEmitter) {
      nalUnitEmitter.value = nalUnit
    }
  }

  private emitSeiPayload(seiPayloadType: number, seiPayload: Uint8Array): void {
    const seiPayloadEmitter = this._seiPayloadEmitters[seiPayloadType]

    if (seiPayloadEmitter) {
      seiPayloadEmitter.value = seiPayload
    }
  }
}
