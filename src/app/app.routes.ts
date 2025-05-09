import {Routes} from '@angular/router';
import {RouteDetailsComponent} from './route-details/route-details.component';
import {SuCoLoMapComponent} from './map/map.component';

export const routes: Routes = [
  {
    path: "",
    component: SuCoLoMapComponent
  },

  {
    path: "debug/route-window",
    component: RouteDetailsComponent,
    data: {debug: true}
  }
];
