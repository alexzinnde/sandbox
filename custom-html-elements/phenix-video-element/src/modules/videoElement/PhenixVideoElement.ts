import type { Maybe } from "../../../types";
import stylesheet from "../../style.css?inline";

const template = document.createElement("template");
template.innerHTML = `<style>${stylesheet}</style>`;

export default class PhenixVideoElement extends HTMLElement {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _canvasCtx: Maybe<CanvasRenderingContext2D>;

  private readonly _videoDecoder: VideoDecoder;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(template.content.cloneNode(true));

    this._canvas = document.createElement("canvas");
    this._canvas.width = 300;
    this._canvas.height = 150;
    shadow.appendChild(this._canvas);

    this._canvasCtx = this._canvas.getContext("2d");

    if (this._canvasCtx) {
      this._canvasCtx.fillStyle = "black";
      this._canvasCtx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    this._videoDecoder = new VideoDecoder({
      output: (frame) => this._onVideoFrame(frame),
      error: (error) => this._onVideoError(error),
    });
  }

  public connectedCallback(): void {
    // Consider checking for properties that may have been set
    // before the element upgraded.
    // https://web.dev/custom-elements-best-practices/
    // this.#upgradeProperty("srcObject");
    // this.#upgradeProperty("currentTime");
  }

  public load(): void {
    // TODO
  }

  public play(): Promise<void> {
    // TODO
    return new Promise((resolve) => {
      resolve();
    });
  }

  public pause(): void {
    // TODO
  }

  private _onVideoError(error: Error) {
    console.error("[PhenixVideoElement] [video error] [%o]", error);
  }

  private _onVideoFrame(frame: VideoFrame) {
    // DO STUFF
    console.log("[PhenixVideoElement] [frame] [%o]", frame);
  }
}

customElements.define("phenix-video", PhenixVideoElement);
