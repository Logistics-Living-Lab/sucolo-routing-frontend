import {Component, NgZone, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {RouteDetailsComponent} from './route-details/route-details.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
  ],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent {
}
