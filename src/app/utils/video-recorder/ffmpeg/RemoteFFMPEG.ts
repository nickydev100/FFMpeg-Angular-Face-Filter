const URL = 'https://ffmpeg.gamechanger.studio';
import * as io from 'socket.io-client';

export class RemoteFFMPEG {
  private _socket;
  private _frames = 0;

  constructor() {
    this._socket = io(URL, {transports : ['websocket']});
  }

  add(base64: string): void {
    this._frames++;
    this._socket.emit('image', base64);
  }

  async getVideo(progressCallback: Function): Promise<Blob> {
    this._socket.emit('produceVideo');

    const url = await new Promise<string>(resolve => {
      this._socket.on('progress', data => progressCallback(Math.floor(data.frames / this._frames * 0.5)));
      this._socket.once('videoURL', data => {
        this._socket.off('progress');
        this._socket.disconnect();
        resolve(data);
      });
    });

    const request = new XMLHttpRequest();
    request.open('GET', `${URL}/${url}`, true);
    request.responseType = 'blob';

    request.onprogress = event => progressCallback(0.5 + Math.floor(event.loaded / event.total * 0.5));

    return new Promise<Blob>(resolve => {
      request.onload = () => resolve(request.response);
      request.send();
    });
  }
}
