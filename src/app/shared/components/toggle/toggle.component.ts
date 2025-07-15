import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-toggle',
  imports: [FormsModule],
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.css'
})
export class ToggleComponent {
  @Input() value: boolean = false;
}
