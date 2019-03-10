export function loadFBX(url: string): Promise<any> {
  return new Promise<any>(resolve => new THREE.FBXLoader().load(url, resolve));
}

export function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function isCordova(): boolean {
  return window['cordova'] != null;
}

export function isIOS(): boolean {
  return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
}

export function isNativeCameraStream(): boolean {
  return isCordova() &&
    window['cordova']['plugins'] != null &&
    window['cordova']['plugins']['CameraStream'] != null;
}

export function cordovaDeviceReady(timeout: number = 5000): Promise<void> {
  return new Promise(resolve => {
    let timer: number;

    function deviceReadyHandler(): void {
      clearTimeout(timer);
      document.removeEventListener('deviceready', deviceReadyHandler);
      resolve();
    }

    timer = setTimeout(deviceReadyHandler, timeout);
    document.addEventListener('deviceready', deviceReadyHandler);
  });
}

// {{BRANCH}} replaced by CircleCI with proper value
let branch = '{{BRANCH}}';

// {{BRANCH}} wasn't replaced make it debug
if (branch.indexOf('{{BR') === 0) {
  branch = 'debug';
}

export {branch};
export const version = '1.b{{VERSION}}';
