import IDisposable from '@zinntechniker/subjectify/dist/types/IDisposable'
import IH264Bitstream from './bitstream/IH264Bitstream'
import PhenixIsoBmff2023 from './bitstream/PhenixIsoBmff2023'

enum PhenixBitstream {
  EmebeddedIsoBmff2023
}

type PhenixBitstreamType = 'embedded-iso-bmff:2023'

export default class EmbeddedIsoBmffExtractor {
  private readonly _h264Bitstream: IH264Bitstream

  constructor(bitstream: PhenixBitstreamType) {
    console.log('bitstream [%o]', bitstream)
    switch (bitstream) {
      case 'embedded-iso-bmff:2023':
        this._h264Bitstream = new PhenixIsoBmff2023()

        break

      default:
        throw new Error(`No extractor for bitstream [${bitstream}]`)
    }
  }

  get h264Bitstream() {
    return {
      subscribeToNalUnit: this._h264Bitstream.subscribeToNalUnit.bind(this._h264Bitstream),
      subscribeToSeiPayload: this._h264Bitstream.subscribeToPayload.bind(this._h264Bitstream)
    }
  }

  public subscribeToPayload(uuid: string, listener: (payload: Uint8Array) => void): IDisposable {
    return this._h264Bitstream.subscribeToPayload(uuid, listener)
  }

  public processVideoChunk(rawChunkData: ArrayBuffer) {
    this._h264Bitstream.processChunk(rawChunkData)
  }
}
