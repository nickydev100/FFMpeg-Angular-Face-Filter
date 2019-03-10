import {isCordova} from './index';

export class SocialSharing {
  public static isSupported(): boolean {
    return isCordova() &&
      window['plugins'] &&
      navigator['device'] &&
      navigator['device']['capture'] &&
      window['plugins']['socialsharing'];
  }

  public static shareBase64(name: string, fileBase64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      window['plugins']['socialsharing'].share(null, name, fileBase64, null, resolve, reject);
    });
  }

  public static shareLocalFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      window['plugins']['socialsharing'].share(null, null, filePath, null, resolve, reject);
    });
  }
}
