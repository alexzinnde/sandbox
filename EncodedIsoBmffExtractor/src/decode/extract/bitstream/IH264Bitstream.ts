import IDisposable from '@zinntechniker/subjectify/dist/types/IDisposable'

interface IH264Bitstream {
  subscribeToNalUnit(nalUnitType: number, listener: (nalUnit: Uint8Array) => void): IDisposable
  subscribeToSeiPayload(payloadType: number, listener: (seiPayload: Uint8Array) => void): IDisposable
  subscribeToPayload(uuid: string, listener: (payload: Uint8Array) => void): IDisposable
  processChunk(rawChunkData: ArrayBuffer): void
}

export default IH264Bitstream
