import {IVideoRecorder} from './IVideoRecorder';
import {FFMPEGVideoRecorder} from './FFMPEGVideoRecorder';

export class VideoRecorderFactory {
  public static get(): IVideoRecorder {
    /*if (window['MediaRecorder'] != null) {
      return new VideoMediaRecorder();
    } else {
      return new WhammyRecorder();
    }*/

    // return new FFMPEGVideoRecorder();
    return new FFMPEGVideoRecorder();
  }
}
