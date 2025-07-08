import {VroomShipmentStepDto} from './VroomShipmentStepDto';

export class VroomShipmentDto {
  pickup?: VroomShipmentStepDto
  delivery?: VroomShipmentStepDto
  amount?: number[] // an array of integers describing multidimensional quantities
  skills?: [number] // an array of integers defining mandatory skills
  priority?: number = 0 //an integer in the [0, 100] range describing priority level (defaults to 0)

  constructor(data: Partial<VroomShipmentDto>) {
    Object.assign(this, data)
  }
}
