import { MediaKeyConfigurationType } from "../mediaKeys/configureMediaKeys";

export type MseDecoderOptionsType = {
  sourceBufferMode?: AppendMode;
}


type MseDecoderConfigType = {
  mediaElement: HTMLMediaElement
  options?: MseDecoderOptionsType
  drm?: MediaKeyConfigurationType;
}

export default MseDecoderConfigType;