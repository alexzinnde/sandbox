type Maybe<T> = T | null;
export type StreamVisualizerOptions = {
  frequencyDomainVisualizer?: boolean
  timeDomainVisualizer?: boolean
}
const WIDTH = 308;
const HEIGHT = 231;

// Interesting parameters to tweak!
const SMOOTHING = 0.8;
const FFT_SIZE = 2048;


const defaultOptions = {
  frequencyDomainVisualizer: true,
  timeDomainVisualizer: true
}

export default class StreamVisualizer {
  private _stream: MediaStream;
  private _canvas: HTMLCanvasElement;
  private _canvasCtx: Maybe<CanvasRenderingContext2D>;
  private _options: StreamVisualizerOptions;
  private _audioContext: AudioContext;
  private _source: MediaStreamAudioSourceNode;
  private _analyser: AnalyserNode;
  private _frequencyDataBuffer: Uint8Array;
  private _timeDataBuffer: Uint8Array;
  private _startTime: number;
  private _startOffset: number;

  constructor(stream: MediaStream, canvas: HTMLCanvasElement, options?: StreamVisualizerOptions) {
    this._stream = stream;
    this._canvas = canvas;
    this._canvasCtx = canvas.getContext("2d");
    this._options = options ?? defaultOptions;

    if (!this._canvasCtx) {
      throw new Error('[StreamVisualizer] No Canvas Context')
    }

    this._audioContext = getAudioContext();
    this._source = this._audioContext.createMediaStreamSource(this._stream);
    this._analyser = this._audioContext.createAnalyser();
    this._analyser.minDecibels = -140;
    this._analyser.maxDecibels = 0;
    this._frequencyDataBuffer = new Uint8Array(this._analyser.frequencyBinCount);
    this._timeDataBuffer = new Uint8Array(this._analyser.frequencyBinCount);
    this._source.connect(this._analyser);
    this._startTime = 0
    this._startOffset = 0
  }

  public start() {
    requestAnimationFrame(this.draw.bind(this))
  }

  public draw() {
    let barWidth;
    let offset;
    let height;
    let percent;
    let value;
    this._analyser.smoothingTimeConstant = SMOOTHING;
    this._analyser.fftSize = FFT_SIZE;

    // Get the frequency data from the currently playing music
    this._analyser.getByteFrequencyData(this._frequencyDataBuffer);
    this._analyser.getByteTimeDomainData(this._timeDataBuffer);

    this._canvas.width = WIDTH;
    this._canvas.height = HEIGHT;

    if (!this._options.frequencyDomainVisualizer === false) {
      // Draw the frequency domain chart.
      for (let i = 0; i < this._analyser.frequencyBinCount; i++) {
        value = this._frequencyDataBuffer[i];
        percent = value / 256;
        height = HEIGHT * percent;
        offset = HEIGHT - height - 1;
        barWidth = WIDTH / this._analyser.frequencyBinCount;

        let hue = i / this._analyser.frequencyBinCount * 360;

        if (this._canvasCtx) {
          this._canvasCtx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
          this._canvasCtx.fillRect(i * barWidth, offset, barWidth, height);
        }
      }
    }

    if (!this._options.timeDomainVisualizer === false) {
      // Draw the time domain chart.
      for (let i = 0; i < this._analyser.frequencyBinCount; i++) {
        value = this._timeDataBuffer[i];
        percent = value / 256;
        height = HEIGHT * percent;
        offset = HEIGHT - height - 1;
        barWidth = WIDTH / this._analyser.frequencyBinCount;

        if (this._canvasCtx) {
          this._canvasCtx.fillStyle = 'white';
          this._canvasCtx.fillRect(i * barWidth, offset, 1, 2);
        }
      }
    }

    requestAnimationFrame(this.draw.bind(this));
  }
}

function getAudioContext() {
  let audioContext: AudioContext;
  // cope with browser differences
  if (typeof AudioContext === 'function') {
    audioContext = new AudioContext();
    // @ts-ignore
  } else if (typeof webkitAudioContext === 'function') {
    // @ts-ignore
    audioContext = new webkitAudioContext(); // eslint-disable-line new-cap
  } else {
    throw new Error('Sorry! Web Audio is not supported by this browser');
  }

  return audioContext;
}