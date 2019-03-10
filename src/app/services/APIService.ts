import {Injectable} from '@angular/core';
import {gcFirebase} from '@gamechanger/gc-firebase';
import {branch} from '../utils';

@Injectable()
export class APIService {
  async login(): Promise<void> {
    await gcFirebase.init({
      clientId: branch,
      gameId: 'face-filter',
    });

    await gcFirebase.auth.loginAnonymously();
  }
}
