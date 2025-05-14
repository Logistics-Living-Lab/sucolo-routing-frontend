import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {AppComponent} from './app/app.component';
import {provideMapboxGL} from 'ngx-mapbox-gl';
import {AppConfig} from './app/config/config.interface';
import {
  PassedInitialConfig,
  provideAuth,
} from 'angular-auth-oidc-client';
import {authConfig} from './app/auth/auth.config';
import {isArray} from 'lodash';

fetch('assets/config.json')
  .then(res => res.json())
  .then((config: AppConfig) => {
    appConfig.providers.push(
      provideMapboxGL({
        accessToken: config.mapboxToken
      }),
      {
        provide: "APP_CONFIG",
        useValue: config,
      },
      provideAuth(mergeAuthConfig(config)),
    )
    return bootstrapApplication(AppComponent, appConfig);
  })
  .catch(err => console.error(err));

function mergeAuthConfig(config: any): PassedInitialConfig {
  if (authConfig.config && !isArray(authConfig.config)) {
    authConfig.config.redirectUrl = config.baseUrl + authConfig.config.redirectUrl
    authConfig.config.authority = config.keycloakUrl
    authConfig.config.clientId = config.keycloakClientId
    authConfig.config.secureRoutes?.push(config.vroomUrl)

  }

  return authConfig
}
