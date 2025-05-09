import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuCoLoMapComponent } from './map.component';

describe('MapComponent', () => {
  let component: SuCoLoMapComponent;
  let fixture: ComponentFixture<SuCoLoMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuCoLoMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuCoLoMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
