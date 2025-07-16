import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-vehicle-form-button',
  imports: [
    MatIcon,
    MatIconButton
  ],
  templateUrl: './vehicle-form-button.component.html',
  styleUrl: './vehicle-form-button.component.css'
})
export class VehicleFormButtonComponent {

  @Input() imageSrc: string = ""
  @Input() length: number = 0
  @Output() vehicleAdded = new EventEmitter<Event>()
  @Output() vehicleRemoved = new EventEmitter<Event>()

  onVehicleAdded(event: Event) {
    this.vehicleAdded.emit(event)
  }

  onVehicleRemoved(event: Event) {
    this.vehicleRemoved.emit(event)
  }

}
