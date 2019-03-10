import {AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, Output} from '@angular/core';
import {isIOS} from '../../utils';

@Component({
  selector: 'app-camera-controls',
  templateUrl: './camera-controls.component.pug',
  styleUrls: ['./camera-controls.component.scss']
})
export class CameraControlsComponent implements AfterViewInit {
  isVideoStarted = false;

  @Output()
  toggleVideo: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  takePhoto: EventEmitter<void> = new EventEmitter<void>();

  private _timerVideoToggle: number;

  constructor(private _elementRef: ElementRef) {

  }

  buttonVideoHandler(): void {
    clearTimeout(this._timerVideoToggle);
    this.isVideoStarted = !this.isVideoStarted;
    this.toggleVideo.emit(this.isVideoStarted);

    if (this.isVideoStarted) {
      // max video length is 30 seconds
      this._timerVideoToggle = setTimeout(this.buttonVideoHandler.bind(this), 30000);
    }
  }

  buttonPhotoHandler(): void {
    this.takePhoto.emit();
  }

  ngAfterViewInit(): void {
    for (const s of ['.button-video', '.button-photo']) {
      const button: HTMLElement = this._elementRef.nativeElement.querySelector(s);

      if (button) {
        button.style.width = `${button.offsetHeight}px`;
      }
    }
  }

  @HostBinding('style.justify-content')
  get justifyContent(): string {
    return this.isVideoRecordingAvailable ? 'space-between' : 'center';
  }

  get isVideoRecordingAvailable(): boolean {
    return !isIOS();
  }
}
