import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {cordovaDeviceReady} from './app/utils';

if (environment.production) {
  enableProdMode();
}

async function main(): Promise<void> {
  await cordovaDeviceReady(5000);
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
}

main();
