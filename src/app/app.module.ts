import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {MaskButtonsComponent} from './components/mask-buttons/mask-buttons.component';
import {CameraControlsComponent} from './components/camera-controls/camera-controls.component';
import {CameraComponent} from './components/camera/camera.component';
import {File} from '@ionic-native/file';
import {CameraElementComponent} from './components/camera/camera-element/camera-element.component';
import {APIService} from './services/APIService';

@NgModule({
  declarations: [
    AppComponent,
    MaskButtonsComponent,
    CameraControlsComponent,
    CameraComponent,
    CameraElementComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    File,
    APIService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
