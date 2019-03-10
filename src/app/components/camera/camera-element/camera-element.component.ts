import {AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output} from '@angular/core';
import {delay, isNativeCameraStream} from '../../../utils';

@Component({
  selector: 'app-camera-element',
  templateUrl: './camera-element.component.pug',
  styleUrls: ['./camera-element.component.scss']
})
export class CameraElementComponent implements AfterViewInit, OnDestroy {
  private _isNativeCameraStream: boolean;
  private _cameraElement: HTMLImageElement | HTMLVideoElement;
  private _isNativeCameraReady: boolean;

  @Output()
  error: EventEmitter<Error> = new EventEmitter();

  @Output()
  ready: EventEmitter<void> = new EventEmitter();

  constructor(private _elementRef: ElementRef) {

  }

  async ngAfterViewInit(): Promise<void> {
    try {
      this._isNativeCameraStream = isNativeCameraStream();
      if (this._isNativeCameraStream) {
        await this.initNativeCameraStream();
      } else {
        await this.initWebCameraStream();
        this.ready.emit();
      }
    } catch (e) {
      console.warn('camera error', e);
      this.error.emit(e);
    }
  }

  private async initNativeCameraStream(): Promise<void> {
    const imageElement: HTMLImageElement = this._cameraElement = document.createElement('img') as HTMLImageElement;
    imageElement.style.position = 'absolute';
    const h: number = this._elementRef.nativeElement.offsetHeight;
    const w: number = this._elementRef.nativeElement.offsetWidth;
    this._elementRef.nativeElement.appendChild(imageElement);
    const loadHandler = () => {
      imageElement.removeEventListener('load', loadHandler);
      const scale = h / imageElement.height;
      const imageElementWidth = imageElement.width * scale;
      imageElement.style.width = `${imageElementWidth}px`;
      imageElement.style.height = `${h}px`;
      imageElement.style.left = `${(w - imageElementWidth) * 0.5}px`;
    };
    imageElement.addEventListener('load', loadHandler);
    window['cordova']['plugins']['CameraStream'].capture = this.captureHandler.bind(this);
    await window['cordova']['plugins']['CameraStream'].startCapture('front');
  }

  private async captureHandler(data: string): Promise<void> {
    if (this._cameraElement['isLoaded'] != null && !this._cameraElement['isLoaded']) {
      return;
    }

    this._cameraElement['isLoaded'] = false;
    this._cameraElement.src = data;
    await new Promise(resolve => {
      this._cameraElement.onload = () => {
       this._cameraElement.onload = null;
       resolve();
      };
    });

    this._cameraElement['isLoaded'] = true;

    if (!this._isNativeCameraReady) {
      this._isNativeCameraReady = true;
      this.ready.emit();
    }
  }

  private async initWebCameraStream(): Promise<void> {
    const videoElement: HTMLVideoElement = this._cameraElement = document.createElement('video') as HTMLVideoElement;

    for (const attr of ['preload', 'autoplay', 'loop', 'muted']) {
      videoElement.setAttribute(attr, attr);
    }

    videoElement.srcObject = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });

    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    this._elementRef.nativeElement.appendChild(videoElement);
    await delay(1000);
  }

  ngOnDestroy(): void {
    if (this._isNativeCameraStream) {
      window['cordova']['plugins']['CameraStream'].stopCapture();
    } else {
      const video: HTMLVideoElement = this._cameraElement as HTMLVideoElement;
      if (video && video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(item => item.stop());
      }
    }
  }

  get element(): HTMLVideoElement | HTMLImageElement {
    return this._cameraElement;
  }
}
