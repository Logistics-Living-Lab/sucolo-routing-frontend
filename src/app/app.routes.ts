import {Routes} from '@angular/router';
import {RouteDetailsComponent} from './route-details/route-details.component';
import {SuCoLoMapComponent} from './map/map.component';
import {autoLoginPartialRoutesGuard} from 'angular-auth-oidc-client';
import {AuthCallbackComponent} from './auth/auth-callback.component';

export const routes: Routes = [
  {
    path: "",
    component: SuCoLoMapComponent,
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
