import { TestBed } from '@angular/core/testing';

import { VroomService } from './vroom.service';

describe('VroomService', () => {
  let service: VroomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VroomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
