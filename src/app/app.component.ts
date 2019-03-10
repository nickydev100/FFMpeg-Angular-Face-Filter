import {Component, ViewChild} from '@angular/core';
import {CameraComponent} from './components/camera/camera.component';
import saveAs from 'file-saver';
import {branch, isIOS, version} from './utils';
import {SocialSharing} from './utils/SocialSharing';
import {File} from '@ionic-native/file';
import * as PleaseRotate from './utils/pleaserotate.js';
import {IVideoRecorder} from './utils/video-recorder/IVideoRecorder';
import {VideoRecorderFactory} from './utils/video-recorder/VideoRecorderFactory';
import {APIService} from './services/APIService';
import swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild(CameraComponent)
  camera: CameraComponent;

  private _videoRecorder: IVideoRecorder;

  constructor(private _file: File, api: APIService) {
    console.log(`%c Face Filter, ${branch}, version ${version}`, 'background: #222; color: #bada55');
    PleaseRotate.start({
      forcePortrait: true,
      allowClickBypass: false,
      subMessage: '',
    });
    api.login();
  }

  maskChangeHandler(maskId: string): void {
    this.camera.setMask(maskId);
  }

  async takePhotoHandler(): Promise<void> {
    if (SocialSharing.isSupported()) {
      const image = await this.camera.takePhotoBase64();
      SocialSharing.shareBase64('photo.png', image);
    } else {
      const image = await this.camera.takePhotoBlob();
      saveAs(image, 'photo.png');
    }
  }

  toggleVideoRecordHandler(value: boolean): void {
    if (value) {
      this.startVideoRecording();
    } else {
      this.stopVideoRecording();
    }
  }

  private startVideoRecording(): void {
    this._videoRecorder = VideoRecorderFactory.get();
    this._videoRecorder.start(this.camera.canvasElement);
  }

  private async stopVideoRecording(): Promise<void> {
    const blob = await this._videoRecorder.stop();

    if (!blob) {
      swal({
        type: 'error',
        title: 'Unable to create MP4 file',
      });
      return;
    }

    if (SocialSharing.isSupported() && window['cordova']['file'] != null) {
      let pathFile = '';

      if (isIOS()) {
        pathFile = this._file.documentsDirectory;
      } else {
        pathFile = this._file.externalDataDirectory;
      }

      const fileName = `video${Date.now()}.mp4`;
      const result: {nativeURL: string} = await this._file.writeFile(pathFile, fileName, blob);
      SocialSharing.shareLocalFile(result.nativeURL);
    } else {
      saveAs(blob, 'video.mp4');
    }
  }
}
