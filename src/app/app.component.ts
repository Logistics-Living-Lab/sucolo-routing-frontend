import {Component, NgZone, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {RouteDetailsComponent} from './route-details/route-details.component';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MAT_SELECT_TRIGGER, MatSelect, MatSelectTrigger} from '@angular/material/select';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FormsModule,
  ],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent {
}
