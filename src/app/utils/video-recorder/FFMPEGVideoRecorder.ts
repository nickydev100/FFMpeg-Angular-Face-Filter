import {IVideoRecorder} from './IVideoRecorder';
import {AccurateTimer} from '../AccurateTimer';
import {IFFMPEG} from './ffmpeg/IFFMPEG';
import {RemoteFFMPEG} from './ffmpeg/RemoteFFMPEG';
import {isIOS} from '../index';
import {LocalFFMPEG} from './ffmpeg/LocalFFMPEG';
import {Progress} from '../Progress';

export class FFMPEGVideoRecorder implements IVideoRecorder {
  private _canvas: HTMLCanvasElement;
  private _timer: number;
  private _isStarted = false;
  private _ffmpeg: IFFMPEG;

  start(canvas: HTMLCanvasElement): void {
    this._canvas = canvas;
    this._ffmpeg = new RemoteFFMPEG();
    this._isStarted = true;
    this._timer = AccurateTimer.setInterval(this.render.bind(this), 40);
  }

  async stop(): Promise<Blob> {
    AccurateTimer.clearInterval(this._timer);
    this._isStarted = false;
    Progress.show();
    try {
      const result = await this._ffmpeg.getVideo((progress: number) => Progress.update(progress));
      Progress.hide();
      return result;
    } catch (e) {
      console.warn('FFMPEGVideoRecorder.stop', e);
      Progress.hide();
    }
  }

  private render(): void {
    if (!this._isStarted) {
      return;
    }

    this._ffmpeg.add(this._canvas.toDataURL('image/jpeg'));
  }
}
