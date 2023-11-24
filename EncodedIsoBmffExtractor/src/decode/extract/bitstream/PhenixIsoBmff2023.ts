import IDisposable from '@zinntechniker/subjectify/dist/types/IDisposable'
import IH264Bitstream from './IH264Bitstream'
import { Subject } from '@zinntechniker/subjectify'

type ExtractedData = {
  nalUnit: Uint8Array
  endIndex: number
  seiPayloads?: ExtractedSeiPayload[]
}

type ExtractedSeiPayload = {
  data: Uint8Array
  type: number
  startIndex: number
  endIndex: number
}

const noop = () => {}
const annexBStartCode = new Uint8Array([0x00, 0x00, 0x00, 0x01])
const seiNalUnitEndByteCode = new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x01])
const phenixInitializationSegmentUuidString = '511e22bd-34c0-4cee-b6c3-3c4d407622c7'
const phenixMediaSegmentUuidString = '00000000-0000-0000-0000-000000000000'
const phenixMediaSegmentUuidStringKey = '00000000000000000000000000000000'

const dmoofByteCode = new Uint8Array([0x6d, 0x6f, 0x6f, 0x66])

export default class PhenixIsoBmff2023 implements IH264Bitstream {
  private readonly _nalUnitEmitters: Record<string, Subject<Uint8Array>> = {}
  private readonly _seiPayloadEmitters: Record<string, Subject<Uint8Array>> = {}
  private readonly _payloadEmitters: Record<string, Subject<Uint8Array>> = {}

  private static extractNonVclNalUnit(chunkData: Uint8Array, offset: number): ExtractedData {
    if (!PhenixIsoBmff2023.isDataAtOffsetAnnexBStartCode(chunkData, offset)) {
      console.warn('[extractNonVclNalUnit] offset [%o] is not starting with Annex B [%o]', offset, chunkData.slice(offset))
      debugger
    }

    const endIndex = this.findNextAnnexBStartCodeFromOffset(chunkData, offset + 4, chunkData.byteLength)

    console.log('extractNonVclNalUnit data[%o] [%o]\nendIndex [%o]', offset, chunkData.slice(offset), endIndex)

    return {
      nalUnit: chunkData.subarray(offset + 4, endIndex),
      endIndex
    }
  }

  private static extractSeiNalUnit(chunkData: Uint8Array, offset: number): ExtractedData {
    console.log('[extractSeiNalUnit] data[%o] [%o]', offset, chunkData.slice(offset))

    if (!PhenixIsoBmff2023.isDataAtOffsetAnnexBStartCode(chunkData, offset)) {
      console.warn('[extractSeiNalUnit] offset [%o] is not starting with Annex B [%o]', offset, chunkData.slice(offset))
      debugger
    }

    const seiPayloads = []
    let currentIndex = offset + 5

    if (chunkData[currentIndex] === 3) {
      const endIndex = PhenixIsoBmff2023.findTargetByteSequenceFromOffset(seiNalUnitEndByteCode, chunkData, currentIndex) + 1

      console.log('[extractSeiNalUnit] filler type end index [%o]', endIndex)
      return {
        nalUnit: new Uint8Array(0),
        endIndex
      }
    }

    console.log('extractSeiNalUnit data[%o] [%o]', currentIndex, chunkData.slice(currentIndex))

    while (!PhenixIsoBmff2023.isDataAtOffsetSeiNalUnitEndByteCode(chunkData, currentIndex) && currentIndex < chunkData.byteLength) {
      const extractedSeiPayload = PhenixIsoBmff2023.extractSeiPayload(chunkData, currentIndex)

      seiPayloads.push(extractedSeiPayload)

      currentIndex = extractedSeiPayload.endIndex + 1
    }

    console.log('SEI Payloads [%o]', seiPayloads)
    const endIndex = seiPayloads[seiPayloads.length - 1].endIndex - 1

    return {
      endIndex,
      nalUnit: chunkData.subarray(offset + 4, endIndex),
      seiPayloads
    }
  }

  private static extractSeiPayload(data: Uint8Array, offset: number): ExtractedSeiPayload {
    let currentIndex = offset
    let typeFfCount = 0
    let sizeFfCount = 0

    while (data[currentIndex] === 0xff) {
      currentIndex++
      typeFfCount++
    }

    // const payloadTypeFfCount = currentIndex - offset
    const payloadType = typeFfCount * 255 + data[currentIndex]
    currentIndex++

    console.log('sei type [%o]', payloadType)

    while (data[currentIndex] === 0xff) {
      currentIndex++
      sizeFfCount++
    }

    // const payloadSizeFfCount = currentIndex - payloadTypeFfCount - 1
    const payloadSize = sizeFfCount * 255 + data[currentIndex]
    console.log('sei payload size [%o]', payloadSize)

    currentIndex++

    return {
      type: payloadType,
      startIndex: currentIndex,
      data: data.subarray(currentIndex, currentIndex + payloadSize + 1),
      endIndex: currentIndex + payloadSize
    }
  }

  private static isDataAtOffsetAnnexBStartCode(data: Uint8Array, offset: number) {
    return this.isDataAtOffsetTargetByteSequence(annexBStartCode, data, offset)
  }

  private static findNextAnnexBStartCodeFromOffset(data: Uint8Array, offset: number, returnValueIfNotFound?: number) {
    return this.findTargetByteSequenceFromOffset(annexBStartCode, data, offset, returnValueIfNotFound)
  }

  private static isDataAtOffsetSeiNalUnitEndByteCode(data: Uint8Array, offset: number) {
    return this.isDataAtOffsetTargetByteSequence(seiNalUnitEndByteCode, data, offset)
  }

  private static isDataAtOffsetTargetByteSequence(targetByteSequence: Uint8Array, data: Uint8Array, offset: number) {
    return targetByteSequence.every((targetByte, targetByteIndex) => data[offset + targetByteIndex] === targetByte)
  }

  private static findTargetByteSequenceFromOffset(targetByteSequence: Uint8Array, data: Uint8Array, offset: number, returnValueIfNotFound?: number) {
    for (let currentIndex = offset; currentIndex < data.byteLength; currentIndex++) {
      if (this.isDataAtOffsetTargetByteSequence(targetByteSequence, data, currentIndex)) {
        return currentIndex
      }
    }

    return returnValueIfNotFound || -1
  }

  public subscribeToNalUnit(nalUnitType: number, listener: (nalUnit: Uint8Array) => void): IDisposable {
    if (!this._nalUnitEmitters[nalUnitType]) {
      this._nalUnitEmitters[nalUnitType] = new Subject<Uint8Array>(undefined)
    }

    return this._nalUnitEmitters[nalUnitType].subscribe(listener)
  }

  public subscribeToSeiPayload(payloadType: number, listener: (seiPayload: Uint8Array) => void): IDisposable {
    if (!this._seiPayloadEmitters[payloadType]) {
      this._seiPayloadEmitters[payloadType] = new Subject<Uint8Array>(undefined)
    }

    return this._seiPayloadEmitters[payloadType].subscribe(listener)
  }

  public subscribeToPayload(uuid: string, listener: (payload: Uint8Array) => void): IDisposable {
    const uuidKey = uuid.replace(/-/g, '')

    if (!this._payloadEmitters[uuidKey]) {
      this._payloadEmitters[uuidKey] = new Subject<Uint8Array>(undefined)
    }

    return this._payloadEmitters[uuidKey].subscribe(listener)
  }

  public processChunk(rawChunkData: ArrayBuffer): void {
    const chunkData = new Uint8Array(rawChunkData)
    let currentIndex = 0

    while (currentIndex < chunkData.byteLength) {
      currentIndex = this.processNextNalUnit(chunkData, currentIndex)
    }
  }

  private processNextNalUnit(chunkData: Uint8Array, offset: number): number {
    const nalUnitType = chunkData[offset + 4] & 0x1f
    console.log('currentIndex [%o] process Nal Unit type [%o]', offset, nalUnitType)

    let extractedData: ExtractedData

    switch (nalUnitType) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        extractedData = this.extractVclNalUnit(chunkData, offset)

        break

      case 6:
        extractedData = PhenixIsoBmff2023.extractSeiNalUnit(chunkData, offset)
        extractedData.seiPayloads?.forEach(seiPayload => this.emitSeiPayload(seiPayload.type, seiPayload.data))

        break

      default:
        extractedData = PhenixIsoBmff2023.extractNonVclNalUnit(chunkData, offset)
    }

    this.emitNalUnit(nalUnitType, extractedData.nalUnit)

    return extractedData.endIndex
  }

  private extractVclNalUnit(chunkData: Uint8Array, offset: number): ExtractedData {
    if (!PhenixIsoBmff2023.isDataAtOffsetAnnexBStartCode(chunkData, offset)) {
      console.warn('[extractVclNalUnit] offset [%o] is not starting with Annex B [%o]', offset, chunkData.slice(offset))
      debugger
    }

    if (PhenixIsoBmff2023.isDataAtOffsetAnnexBStartCode(chunkData, offset + 36)) {
      console.log('Found truncated VCL')

      return {
        nalUnit: chunkData.subarray(offset + 4, offset + 37),
        endIndex: offset + 36
      }
    }

    console.log('Found VCL embedded data[%o] [%o]', offset, chunkData.slice(offset))

    const nalUnit = chunkData.subarray(offset)

    this.emitVclEmbeddedData(nalUnit)

    return {
      nalUnit,
      endIndex: chunkData.byteLength
    }
  }

  private emitNalUnit(nalUnitType: number, nalUnit: Uint8Array) {
    try {
      this._nalUnitEmitters[nalUnitType].value = nalUnit
    } catch (e) {
      noop()
    }
  }

  private emitSeiPayload(payloadType: number, data: Uint8Array) {
    switch (payloadType) {
      case 5: {
        const payloadUuid = Array.from(data.subarray(0, 16))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('')
        const payload = data.subarray(16)

        this.emitPayload(payloadUuid, payload)
      }

      default:
        try {
          this._payloadEmitters[payloadType].value = data
        } catch (e) {
          noop()
        }
    }
  }

  private emitVclEmbeddedData(nalUnit: Uint8Array) {
    const dmoofIndex = PhenixIsoBmff2023.findTargetByteSequenceFromOffset(dmoofByteCode, nalUnit, 0)

    try {
      this._payloadEmitters[phenixMediaSegmentUuidStringKey].value = nalUnit.subarray(dmoofIndex - 4)
    } catch (e) {
      noop()
    }
  }

  private emitPayload(uuid: string, payload: Uint8Array) {
    try {
      this._payloadEmitters[uuid].value = payload
    } catch (e) {
      console.warn('Received unexpected UUID [%s]', uuid)
      this._payloadEmitters[uuid] = new Subject<Uint8Array>(payload)
    }
  }
}
