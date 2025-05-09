import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {AppComponent} from './app/app.component';
import {provideMapboxGL} from 'ngx-mapbox-gl';
import {AppConfig} from './app/config/config.interface';

fetch('/assets/config.json')
  .then(res => res.json())
  .then((config: AppConfig) => {
    appConfig.providers.push(
      provideMapboxGL({
        accessToken: config.mapboxToken
      }),
      {
        provide: "APP_CONFIG",
        useValue: config,
      }
    )
    return bootstrapApplication(AppComponent, appConfig);
  })
  .catch(err => console.error(err));
