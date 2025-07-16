import {VroomJobDto} from './VroomJobDto';
import {VroomShipmentDto} from './VroomShipmentDto';
import {VroomVehicleDto} from './VroomVehicleDto';

export class VroomDto {
  jobs?: VroomJobDto[]
  shipments?: VroomShipmentDto[]
  vehicles?: VroomVehicleDto[]
  matrix?: any
  options?: any

  constructor(data: Partial<VroomDto>) {
    Object.assign(this, data)
  }
}
