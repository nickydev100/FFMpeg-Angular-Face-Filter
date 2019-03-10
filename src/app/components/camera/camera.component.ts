import {Component, ElementRef, ViewChild} from '@angular/core';
import {loadFBX} from '../../utils';
import swal from 'sweetalert2';
import {CameraElementComponent} from './camera-element/camera-element.component';
import {JEEFACEFILTERAPI} from '../../vendor/jeeliz/jeelizFaceFilter.js';

const SETTINGS = {
  rotationOffsetX: 0, // negative -> look upper. in radians
  cameraFOV: 40,      // in degrees, 3D camera FOV
  pivotOffsetYZ: [0.2, 0.2], // XYZ of the distance between the center of the cube and the pivot
  detectionThreshold: 0.75, // sensibility, between 0 and 1. Less -> more sensitive
  detectionHysteresis: 0.05,
  scale: 1 // scale of the 3D cube
};

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.pug',
  styleUrls: ['./camera.component.scss']
})
export class CameraComponent {
  private _threeVideoTexture;
  private _threeRenderer;
  private _threeFaceObject;
  private _threeFaceObject3DPivoted;
  private _threeScene;
  private _threeCamera;
  private _isDetected = false;
  private _maskId = 'mascot-flame-hairs-mask1';

  canvasElement: HTMLCanvasElement;

  @ViewChild(CameraElementComponent)
  camera: CameraElementComponent;

  constructor(private _elementRef: ElementRef) {

  }

  cameraReadyHandler(): void {
    JeelizResizer.size_canvas({
      canvasId: 'jeeFaceFilterCanvas',
      callback: (isError, bestVideoSettings) => this.initFaceFilter(bestVideoSettings)
    });
  }

  cameraErrorHandler(): void {
    swal({
      type: 'error',
      title: 'Camera isn\'t available',
    });
  }

  private fakeCanvas(): void {
    this.canvasElement = document.getElementById('jeeFaceFilterCanvas') as HTMLCanvasElement;
    this.canvasElement.width = this._elementRef.nativeElement.offsetWidth;
    this.canvasElement.height = this._elementRef.nativeElement.offsetHeight;
    const context: CanvasRenderingContext2D = this.canvasElement.getContext('2d');

    setInterval(() => {
      context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      context.fillStyle = '#ff0000';
      context.beginPath();
      context.arc(Math.random() * this.canvasElement.width, Math.random() * this.canvasElement.height, 50, 0, 2 * Math.PI);
      context.stroke();
      context.fill();
    }, 50);
  }

  private async initFaceFilter(videoSettings): Promise<void> {
    this.canvasElement = document.getElementById('jeeFaceFilterCanvas') as HTMLCanvasElement;
    videoSettings.videoElement = this.camera.element;
    JEEFACEFILTERAPI.init({
      canvasId: 'jeeFaceFilterCanvas',
      NNCpath: 'https://appstatic.jeeliz.com/faceFilter/', // root of NNC.json file
      // videoSettings: videoSettings,
      callbackReady: this.jeelizFilterApiReadyHandler.bind(this),

      // called at each render iteration (drawing loop)
      callbackTrack: this.trackHandler.bind(this),
    });
  }

  private detectHandler(isDetected): void {
    if (isDetected) {
      console.log('INFO in detect_callback() : DETECTED');
    } else {
      console.log('INFO in detect_callback() : LOST');
    }
  }

  private trackHandler(detectState): void {
    if (this._isDetected && detectState.detected < SETTINGS.detectionThreshold - SETTINGS.detectionHysteresis) {
      // DETECTION LOST
      this.detectHandler(false);
      this._isDetected = false;
    } else if (!this._isDetected && detectState.detected > SETTINGS.detectionThreshold + SETTINGS.detectionHysteresis) {
      // FACE DETECTED
      this.detectHandler(true);
      this._isDetected = true;
    }

    if (this._isDetected) {
      // move the cube in order to fit the head
      const tanFOV = Math.tan(this._threeCamera.aspect * this._threeCamera.fov * Math.PI / 360); // tan(FOV/2), in radians
      const W = detectState.s;  // relative width of the detection window (1-> whole width of the detection window)
      const D = 1 / (2 * W * tanFOV); // distance between the front face of the cube and the camera

      // coords in 2D of the center of the detection window in the viewport :
      const xv = detectState.x;
      const yv = detectState.y;

      // coords in 3D of the center of the cube (in the view coordinates system)
      // minus because view coordinate system Z goes backward. -0.5 because z is the coord of the center of the cube (not the front face)
      const z = -D - 0.5;
      const x = xv * D * tanFOV;
      const y = yv * D * tanFOV / this._threeCamera.aspect;

      // move and rotate the cube
      this._threeFaceObject.scale.set(1, 1, 1); // show model when detected
      this._threeFaceObject.position.set(x, y + SETTINGS.pivotOffsetYZ[0], z + SETTINGS.pivotOffsetYZ[1]);
      this._threeFaceObject.rotation.set(detectState.rx + SETTINGS.rotationOffsetX, detectState.ry, detectState.rz, 'XYZ');
    } else {
      this._threeFaceObject.scale.set(0, 0, 0); // hide model when detected
    }

    this._threeRenderer.state.reset();

    // trigger the render of the THREE.JS SCENE
    this._threeRenderer.render(this._threeScene, this._threeCamera);
  }

  private jeelizFilterApiReadyHandler(errCode, spec): void {
    if (errCode) {
      console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
      return;
    }

    console.log('INFO : JEEFACEFILTERAPI IS READY');
    this.initThreeScene(spec);
  }

  private async initThreeScene(spec): Promise<void> {
    // INIT THE THREE.JS context
    this._threeRenderer = new THREE.WebGLRenderer({
      context: spec.GL,
      canvas: spec.canvasElement
    });

    // COMPOSITE OBJECT WHICH WILL FOLLOW THE HEAD
    // in fact we create 2 objects to be able to shift the pivot point
    this._threeFaceObject = new THREE.Object3D();
    this._threeFaceObject.frustumCulled = false;
    this._threeFaceObject3DPivoted = new THREE.Object3D();
    this._threeFaceObject3DPivoted.frustumCulled = false;
    this._threeFaceObject3DPivoted.position.set(0, -SETTINGS.pivotOffsetYZ[0], -SETTINGS.pivotOffsetYZ[1]);
    this._threeFaceObject3DPivoted.scale.set(SETTINGS.scale, SETTINGS.scale, SETTINGS.scale);
    this._threeFaceObject.add(this._threeFaceObject3DPivoted);

    this.updateMask();

    // CREATE THE SCENE
    this._threeScene = new THREE.Scene();
    this._threeScene.add(this._threeFaceObject);

    // init video texture with red
    this._threeVideoTexture = new THREE.DataTexture(new Uint8Array([255, 0, 0]), 1, 1, THREE.RGBFormat);
    this._threeVideoTexture.needsUpdate = true;

    // CREATE THE VIDEO BACKGROUND
    const videoMaterial = new THREE.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      vertexShader: 'attribute vec2 position;\n\
            varying vec2 vUV;\n\
            void main(void){\n\
                gl_Position=vec4(position, 0., 1.);\n\
                vUV=0.5+0.5*position;\n\
            }',
      fragmentShader: 'precision lowp float;\n\
            uniform sampler2D samplerVideo;\n\
            varying vec2 vUV;\n\
            void main(void){\n\
                gl_FragColor=texture2D(samplerVideo, vUV);\n\
            }',
      uniforms: {
        samplerVideo: {value: this._threeVideoTexture}
      }
    });
    const videoGeometry = new THREE.BufferGeometry();
    const videoScreenCorners = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
    videoGeometry.addAttribute('position', new THREE.BufferAttribute(videoScreenCorners, 2));
    videoGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1));
    const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
    videoMesh.onAfterRender = () => {
      // replace THREEVIDEOTEXTURE.__webglTexture by the real video texture
      this._threeRenderer.properties.update(this._threeVideoTexture, '__webglTexture', spec.videoTexture);
      this._threeVideoTexture.magFilter = THREE.LinearFilter;
      this._threeVideoTexture.minFilter = THREE.LinearFilter;
      delete(videoMesh.onAfterRender);
    };
    videoMesh.renderOrder = -1000; // render first
    videoMesh.frustumCulled = false;
    this._threeScene.add(videoMesh);

    // CREATE THE CAMERA
    const aspecRatio = spec.canvasElement.width / spec.canvasElement.height;
    this._threeCamera = new THREE.PerspectiveCamera(SETTINGS.cameraFOV, aspecRatio, 0.1, 100);

    // CREATE A LIGHT
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    this._threeScene.add(ambient);

    // CREATE A SPOTLIGHT
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(100, 1000, 100);

    spotLight.castShadow = true;
    this._threeScene.add(spotLight);
  }

  setMask(maskId: string): void {
    if (this._maskId === maskId) {
      return;
    }

    this._maskId = maskId;
    this.updateMask();
  }

  async takePhotoBlob(): Promise<Blob> {
    return new Promise<Blob>(resolve => this.canvasElement.toBlob(resolve, 'image/png'));
  }

  async takePhotoBase64(): Promise<string> {
    return this.canvasElement.toDataURL('image/png');
  }

  private async updateMask(): Promise<void> {
    if (!this._threeFaceObject3DPivoted) {
      return;
    }

    this._threeFaceObject3DPivoted.children.forEach(child => this._threeFaceObject3DPivoted.remove(child));

    const obj = await loadFBX(`assets/models/${this._maskId}.fbx`);
    obj.scale.multiplyScalar(1);
    obj.rotation.set(0, 0, 0);
    obj.position.set(0, -0.3, -0.55);
    obj.frustumCulled = false;

    this._threeFaceObject3DPivoted.add(obj);
  }
}
