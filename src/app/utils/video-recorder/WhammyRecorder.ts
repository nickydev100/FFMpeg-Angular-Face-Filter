import {IVideoRecorder} from './IVideoRecorder';
import {AccurateTimer} from '../AccurateTimer';

export class WhammyRecorder implements IVideoRecorder {
  private readonly _offscreenCanvas: HTMLCanvasElement;
  private readonly _offscreenContext: CanvasRenderingContext2D;

  private _canvas: HTMLCanvasElement;
  private _encoder;
  private _isStarted: boolean;
  private _timer: number;

  constructor() {
    this._offscreenCanvas = document.createElement('canvas') as HTMLCanvasElement;
    this._offscreenContext = this._offscreenCanvas.getContext('2d');
  }

  start(canvas: HTMLCanvasElement): void {
    this._canvas = canvas;
    this._offscreenCanvas.width = canvas.width;
    this._offscreenCanvas.height = canvas.height;
    this._encoder = new Whammy.Video(25);
    this._isStarted = true;
    this._timer = AccurateTimer.setInterval(this.render.bind(this), 40);
  }

  stop(): Promise<Blob> {
    this._isStarted = false;
    AccurateTimer.clearInterval(this._timer);
    return new Promise(resolve => {
      this._encoder.compile(false, blob => {
        resolve(blob);
        this._canvas = null;
        this._encoder = null;
      });
    });
  }

  private render(): void {
    if (!this._isStarted) {
      return;
    }

    this._offscreenContext.drawImage(this._canvas, 0, 0);
    this._encoder.add(this._offscreenCanvas);
  }
}
