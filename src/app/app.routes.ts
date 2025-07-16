import {Routes} from '@angular/router';
import {RouteDetailsComponent} from './route-details/route-details.component';
import {AppMapComponent} from './map/app-map.component';
import {autoLoginPartialRoutesGuard} from 'angular-auth-oidc-client';
import {AuthCallbackComponent} from './auth/auth-callback.component';
import {MapViewerComponent} from './map-viewer/map-viewer.component';

export const routes: Routes = [
  {
    path: "",
    component: MapViewerComponent,
    canActivate: [autoLoginPartialRoutesGuard]
  },

  {
    path: "debug/route-window",
    component: RouteDetailsComponent,
    data: {debug: true}
  },

  {
    path: "callback",
    component: AuthCallbackComponent,
  }
];
