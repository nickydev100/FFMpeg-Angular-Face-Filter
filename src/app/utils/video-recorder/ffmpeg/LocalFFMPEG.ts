import {IFFMPEG} from './IFFMPEG';
import {Deferred} from '../../Deferred';

export class LocalFFMPEG implements IFFMPEG {
  private _worker: Worker;
  private _images: string[] = [];
  private _deferredWorkerReady: Deferred = new Deferred();
  private _deferredResult: Deferred = new Deferred();
  private _progressCallback: Function;

  constructor() {
    this._worker = new Worker('assets/js/ffmpeg/ffmpeg-worker-mp4.js');
    this._worker.addEventListener('message', this.workerMessageHandler.bind(this));
  }

  private async workerReady(): Promise<void> {
    if (this._deferredWorkerReady) {
      return this._deferredWorkerReady.promise;
    }
  }

  private workerMessageHandler(event: { data: any }): void {
    const data = event.data;

    switch (data.type) {
      case 'ready': {
        this._deferredWorkerReady.resolve();
        this._deferredWorkerReady = null;
        return;
      }

      case 'done': {
        this._deferredResult.resolve(new Blob([data.data.MEMFS[0].data], {type: 'video/mp4'}));
        this._worker.terminate();
        break;
      }

      case 'stdout':
      case 'stderr': {

        if (this._progressCallback == null) {
          return;
        }

        const p1 = data.data.indexOf('frame=');

        if (p1 === -1) {
          return;
        }

        const p2 = data.data.indexOf('fps');

        if (p2 === -1) {
          return;
        }

        const frameString = data.data.substring(p1 + 6, p2).trim();
        const frame = parseInt(frameString, 10);
        this._progressCallback(frame / this._images.length);
        return;
      }

      case 'exit': {
        console.log('Process exited with code ' + data.data);
        return;
      }

      default: {
        console.log('LocalFFMPEG.workerMessageHandler: unknown type:', data.type);
      }
    }
  }

  add(base64: string): void {
    this._images.push(base64);
  }

  async getVideo(progressCallback: Function): Promise<Blob> {
    this._progressCallback = progressCallback;
    await this.workerReady();
    const blobs = this._images
      .map(convertDataURIToBinary)
      .map((item, index) => {
        return {
          name: `${index.toString().padStart(5, '0')}.jpg`,
          data: item,
        };
      });

    this._worker.postMessage({
      type: 'run',
      MEMFS: blobs,
      arguments: ['-nostdin', '-i', '%05d.jpg', '-framerate', '25', '-an', '-vf', 'scale=480:-2', '-preset', 'ultrafast', 'out.mp4'],
    });

    return this._deferredResult.promise;
  }
}

const BASE64_MARKER = ';base64,';

function convertDataURIToBinary(dataURI: string): Uint8Array {
  const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  const base64 = dataURI.substring(base64Index);
  const raw = window.atob(base64);
  const rawLength = raw.length;
  const array = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}
