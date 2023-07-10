
export type MseDecoderOptionsType = {
  sourceBufferMode?: AppendMode;
}


type MseDecoderConfigType = {
  mediaElement: HTMLMediaElement
  options?: MseDecoderOptionsType
}

export default MseDecoderConfigType;