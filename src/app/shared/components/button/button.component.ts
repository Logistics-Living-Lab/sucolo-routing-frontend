import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-button',
  imports: [
    NgClass
  ],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  @Input() type: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<Event>();

  onClick(event: Event) {
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }

}
