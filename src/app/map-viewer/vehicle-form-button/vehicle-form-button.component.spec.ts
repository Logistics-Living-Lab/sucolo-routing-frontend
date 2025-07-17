import {ComponentFixture, TestBed} from '@angular/core/testing';

import {VehicleFormButtonComponent} from './vehicle-form-button.component';

describe('VehicleFormButtonComponent', () => {
  let component: VehicleFormButtonComponent;
  let fixture: ComponentFixture<VehicleFormButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleFormButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleFormButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
