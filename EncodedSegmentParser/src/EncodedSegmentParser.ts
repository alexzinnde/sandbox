import { Subject, ReadOnlySubject } from '@zinntechniker/subjectify'
import IDisposable from './IDisposable'

export type SeiUserUnregsiteredData = {
  uuid: string
  payload: Uint8Array
}

type Subscriptions = {
  byUuid: Record<string, Subject<Uint8Array>>
  bySeiType: Record<string, Subject<Uint8Array>>
}

const defaultSubscriptions: Subscriptions = {
  byUuid: {
    // Phenix Embedded ISOBMFF Video MediaSegment
    '0': new Subject<Uint8Array>(undefined),
    // Phenix Embedded ISOBMFF Audio InitializationSegment
    '1': new Subject<Uint8Array>(undefined),
    // Phenix Embedded ISOBMFF Audio MediaSegment
    '2': new Subject<Uint8Array>(undefined),

    // Phenix Embedded ISOBMFF InitializationSegment
    '511e22bd34c04ceeb6c33c4d407622c7': new Subject<Uint8Array>(undefined)
  },
  bySeiType: {}
}

const annexBStartCode = new Uint8Array([0x00, 0x00, 0x00, 0x01])
const initializatonSegmentStartCode = new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x06, 0x05])
const moofByteCode = new Uint8Array([0x6d, 0x6f, 0x6f, 0x66])
const ftypByteCode = new Uint8Array([0x66, 0x74, 0x79, 0x70])

export default class EncodedSegmentExtractor {
  private readonly _subscriptions: Subscriptions = { ...defaultSubscriptions }

  public subscribeToPhenixEmedded(uuid: string, listener: (data: Uint8Array) => void): IDisposable {
    const uuidKey = uuid.replace(/-/g, '')

    if (!this._subscriptions.byUuid[uuidKey]) {
      this._subscriptions.byUuid[uuidKey] = new Subject<Uint8Array>(undefined)
    }

    const subscriptionDisposable = this._subscriptions.byUuid[uuidKey].subscribe(listener)

    return subscriptionDisposable
  }

  public extractAudio(chunkData: ArrayBuffer): void {
    const data = new Uint8Array(chunkData)

    if (this.isFtypByteCodePresent(data)) {
      this._subscriptions.byUuid['1'].value = data

      return
    }

    this._subscriptions.byUuid['2'].value = data
  }

  public extractVideo(chunkData: ArrayBuffer): void {
    const data = new Uint8Array(chunkData)

    this.processChunk(data)
  }

  private processChunk(data: Uint8Array) {
    let currentIndex = 0

    while (data[currentIndex] !== undefined) {
      currentIndex = this.extractNaluByNaluType(data, currentIndex)
    }
  }

  private extractNaluByNaluType(data: Uint8Array, currentIndex: number): number {
    const naluType = data[currentIndex + 4] & 0x1f

    switch (naluType) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return this.onVclNalu(data, currentIndex)
      case 6:
        return this.extractSeiNalu(data, currentIndex)

      default:
        console.log('In extractNalu default case nalu Type [%o]\n [%o]', naluType, data.subarray(currentIndex, currentIndex + 10))
        const nextAnnexBStartCodeIndex = this.findTargetByteSequenceIndex(annexBStartCode, data, currentIndex + 1)

        if (nextAnnexBStartCodeIndex > -1) {
          return nextAnnexBStartCodeIndex
        }

        return data.byteLength
    }
  }

  private onVclNalu(data: Uint8Array, vclNaluStartIndex: number) {
    if (this.isDataAtIndexAnnexBStartCode(data, vclNaluStartIndex + 36) || this.isDataAtIndexAnnexBStartCode(data, vclNaluStartIndex + 20)) {
      return vclNaluStartIndex + 36
    }

    const mediaSegment = data.subarray(vclNaluStartIndex + 36)
    this._subscriptions.byUuid[0].value = mediaSegment

    return data.byteLength
  }

  // seiNaluHeader | seiType byte | payloadSize |
  private extractSeiNalu(data: Uint8Array, seiNaluStartIndex = 0) {
    const seiType = data[seiNaluStartIndex + 5]
    let seiUuid: string
    let seiPayload: Uint8Array
    let seiCurrentIndex = seiNaluStartIndex + 6

    while (data[seiCurrentIndex] === 0xff) {
      seiCurrentIndex += 1
    }

    const ffCount = seiCurrentIndex - seiNaluStartIndex - 6
    const payloadSize = 255 * ffCount + data[seiCurrentIndex]

    seiCurrentIndex += 1

    if (seiType === 5) {
      seiUuid = Array.from(data.subarray(seiCurrentIndex, seiCurrentIndex + 16))
        .map((byte: number) => byte.toString(16).padStart(2, '0'))
        .join('')

      seiPayload = data.subarray(seiCurrentIndex + 16, seiCurrentIndex + payloadSize)

      if (!this._subscriptions.byUuid[seiUuid]) {
        console.warn('Received unknown sei uuid [%o]', seiUuid)

        this._subscriptions.byUuid[seiUuid] = new Subject<Uint8Array>(undefined)
      }
      this._subscriptions.byUuid[seiUuid].value = seiPayload

      const endOfPayloadIndex = seiCurrentIndex + payloadSize - 15

      return endOfPayloadIndex
    } else {
      const nextAnnexBStartCodeIndex = this.findTargetByteSequenceIndex(annexBStartCode, data, seiCurrentIndex + 1)

      if (nextAnnexBStartCodeIndex > -1) {
        return nextAnnexBStartCodeIndex
      }

      return data.byteLength

      seiPayload = data.subarray(seiCurrentIndex, seiCurrentIndex + payloadSize)

      if (this._subscriptions.bySeiType[seiType]) {
        this._subscriptions.bySeiType[seiType].value = seiPayload
      }

      return seiCurrentIndex + payloadSize
    }
  }

  private isFtypByteCodePresent(data: Uint8Array, offset = 0) {
    return this.findTargetByteSequenceIndex(ftypByteCode, data, offset) > -1
  }

  private findAllMoofBoxIndices(data: Uint8Array, offset = 0) {
    return this.findAllTargetSequenceIndicies(moofByteCode, data, offset)
  }

  private findUserDefinedDataStartIndex(data: Uint8Array, currentIndex = 0) {
    return this.findTargetByteSequenceIndex(initializatonSegmentStartCode, data, currentIndex)
  }

  private isCurrentIndexAtAnnexBStartCode(data: Uint8Array, currentIndex: number) {
    return annexBStartCode.every((targetByte, targetByteIndex) => data[targetByteIndex + currentIndex] === targetByte)
  }

  private isDataAtIndexAnnexBStartCode(data: Uint8Array, index: number) {
    return this.isDataAtIndexTargetSequence(annexBStartCode, data, index)
  }

  private isDataAtIndexTargetSequence(targetSequence: Uint8Array, data: Uint8Array, index: number) {
    return targetSequence.every((targetByte, targetByteIndex) => data[targetByteIndex + index] === targetByte)
  }

  private findAllAnnexBIndicies(data: Uint8Array, offset = 0): number[] {
    if (offset > data.byteLength) {
      return []
    }

    const annexBIndex = this.findTargetByteSequenceIndex(annexBStartCode, data, offset)

    if (annexBIndex > -1) {
      return [annexBIndex].concat(this.findAllAnnexBIndicies(data, annexBIndex + 1))
    }

    return []
  }

  private findAllTargetSequenceIndicies(targetSequence: Uint8Array, data: Uint8Array, offset = 0): number[] {
    if (offset > data.byteLength) {
      return []
    }

    const targetSequenceIndex = this.findTargetByteSequenceIndex(targetSequence, data, offset)

    if (targetSequenceIndex > -1) {
      return [targetSequenceIndex].concat(this.findTargetByteSequenceIndex(targetSequence, data, targetSequenceIndex + 1))
    }

    return []
  }

  private findTargetByteSequenceIndex(targetSequence: Uint8Array, data: Uint8Array, startIndex = 0) {
    for (let currentIndex = startIndex; currentIndex < data.byteLength; currentIndex++) {
      if (targetSequence.every((targetByte, targetByteIndex) => data[targetByteIndex + currentIndex] === targetByte)) {
        return currentIndex
      }
    }

    return -1
  }
}
