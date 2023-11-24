export default class EncodedMediaPlaybackManager {
  private readonly _mediaElement: HTMLMediaElement
  private readonly _minimumDurationSinceLastPlaybackRateChangeInMilliSeconds = 1000
  private readonly _maximumLagInSeconds: number = 0.3
  private readonly _minimumLagInSeconds: number = 0.1
  private readonly _playbackRateToDecreaseLag: number = 1.05
  private readonly _playbackRateToIncreaseLag: number = 0.97

  private _timestampOfLastPlaybackRateChange: number

  constructor(mediaElement: HTMLMediaElement) {
    this._mediaElement = mediaElement
    this._timestampOfLastPlaybackRateChange = Date.now()

    this.onBufferedEndChange = this.onBufferedEndChange.bind(this)
  }

  public onBufferedEndChange(bufferedEnd: number) {
    const now = Date.now()
    const durationSinceLastPlaybackRateChange = now - this._timestampOfLastPlaybackRateChange
    // console.log('Duration since last plauback rate change [%o]', durationSinceLastPlaybackRateChange)

    if (durationSinceLastPlaybackRateChange < this._minimumDurationSinceLastPlaybackRateChangeInMilliSeconds) {
      //   console.warn(
      //     'Duration since last plauback rate change [%o] below threshold [%o]',
      //     durationSinceLastPlaybackRateChange,
      //     this._minimumDurationSinceLastPlaybackRateChangeInMilliSeconds
      //   )

      return
    }

    const lag = bufferedEnd - this._mediaElement.currentTime

    if (lag > this._minimumLagInSeconds && lag < this._maximumLagInSeconds && this._mediaElement.playbackRate !== 1) {
      //   console.log('lag [%o] is withing thresholds. Setting playback rate to 1', lag)
      this._mediaElement.playbackRate = 1
      this._timestampOfLastPlaybackRateChange = now

      return
    }

    if (lag > this._maximumLagInSeconds) {
      //   console.log('lag [%o] is above max [%o] increasing playback rate to [%o]', lag.toFixed(3), this._maximumLagInSeconds, this._playbackRateToDecreaseLag)
      this._mediaElement.playbackRate = this._playbackRateToDecreaseLag
      this._timestampOfLastPlaybackRateChange = now

      return
    }

    if (lag < this._minimumLagInSeconds) {
      //   console.log('lag [%o] is below minimum [%o] decreasing playback rate to [%o]', lag.toFixed(3), this._maximumLagInSeconds, this._playbackRateToIncreaseLag)
      this._mediaElement.playbackRate = this._playbackRateToIncreaseLag
      this._timestampOfLastPlaybackRateChange = now

      return
    }
  }
}
