import { Subject } from '@zinntechniker/subjectify'
import H264BitStream from './H264BitStream'
import PhenixEmbeddedIsoBmff2023Extractor from './PhenixEmbeddedIsoBmff2023Extractor'
import IDisposable from '@zinntechniker/subjectify/dist/types/IDisposable'
import DispoableList from '../../lang/disposable/DisposableList'

const phenixMediaSegmentUuidString = '00000000000000000000000000000000'

export default class EncodedIsoBmffExtractor {
  private readonly _payloadByUuidEmiters: Record<string, Subject<Uint8Array>> = {}
  private readonly _h264BitStream: H264BitStream
  private readonly _disposables: DispoableList = new DispoableList()

  constructor() {
    // TODO
    this._h264BitStream = new H264BitStream(PhenixEmbeddedIsoBmff2023Extractor)
    // }
    this.initialize()
  }

  get h264BitStream() {
    return {
      subscribeToNalUnitType: this._h264BitStream.subscribeToNalUnitType.bind(this._h264BitStream),
      subscribeToSeiPayloadType: this._h264BitStream.subscribeToSeiPayloadType.bind(this._h264BitStream)
    }
  }

  public extract(rawChunkData: ArrayBuffer): void {
    this._h264BitStream.extract(rawChunkData)
  }

  public subscribeToPayload(uuid: string, listener: (data: Uint8Array) => void): IDisposable {
    const uuidKey = uuid.replace(/-/g, '')

    let payloadEmiter = this._payloadByUuidEmiters[uuidKey]

    if (!payloadEmiter) {
      console.log('Registering payload UUID [%o]', uuid)

      payloadEmiter = new Subject<Uint8Array>(undefined)
      this._payloadByUuidEmiters[uuidKey] = payloadEmiter
    }

    return payloadEmiter.subscribe(listener)
  }

  private initialize() {
    const onVclNalUnitExtracted = (vclNalUnit: Uint8Array) => {
      if (vclNalUnit && this._payloadByUuidEmiters[phenixMediaSegmentUuidString]) {
        this._payloadByUuidEmiters[phenixMediaSegmentUuidString].value = vclNalUnit.subarray(32)
      }
    }

    const onSeiUserUnregisteredDataExtracted = (seiPayload: Uint8Array) => {
      if (seiPayload?.byteLength === 0) {
        return
      }

      const seiPayloadUuid = Array.from(seiPayload.subarray(0, 16))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')

      if (this._payloadByUuidEmiters[seiPayloadUuid]) {
        this._payloadByUuidEmiters[seiPayloadUuid].value = seiPayload.subarray(16)

        return
      }

      console.error('Received unexpected UUID [%s]', seiPayloadUuid)
      this._payloadByUuidEmiters[seiPayloadUuid] = new Subject<Uint8Array>(seiPayload.subarray(16))
    }

    this._disposables.add(this._h264BitStream.subscribeToNalUnitType(1, onVclNalUnitExtracted))
    this._disposables.add(this._h264BitStream.subscribeToNalUnitType(2, onVclNalUnitExtracted))
    this._disposables.add(this._h264BitStream.subscribeToNalUnitType(3, onVclNalUnitExtracted))
    this._disposables.add(this._h264BitStream.subscribeToNalUnitType(4, onVclNalUnitExtracted))
    this._disposables.add(this._h264BitStream.subscribeToNalUnitType(5, onVclNalUnitExtracted))
    this._disposables.add(this._h264BitStream.subscribeToSeiPayloadType(5, onSeiUserUnregisteredDataExtracted))
  }
}
