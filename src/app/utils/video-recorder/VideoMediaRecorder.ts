import {IVideoRecorder} from './IVideoRecorder';
import {delay} from '../index';

export class VideoMediaRecorder implements IVideoRecorder {
  private _mediaRecorder;
  private _recordedChunks: any[];

  start(canvas: HTMLCanvasElement): void {
    this._mediaRecorder = new MediaRecorder(canvas['captureStream'](25), {mimeType: 'video/webm'});
    this._mediaRecorder.ondataavailable = this.mediaRecorderDataHandler.bind(this);
    this._recordedChunks = [];
    this._mediaRecorder.start();
  }

  async stop(): Promise<Blob> {
    this._mediaRecorder.stop();
    await delay(200);
    this._mediaRecorder.ondataavailable = null;
    return new Blob(this._recordedChunks, {
      type: 'video/webm'
    });
  }

  private mediaRecorderDataHandler(event): void {
    if (event.data.size > 0) {
      this._recordedChunks.push(event.data);
    }
  }
}
