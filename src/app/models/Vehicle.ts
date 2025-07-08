export class Vehicle {

  id!: number;
  type!: "car" | "bike"
  maxTasks?: number;
  speedFactor?: number = 1.0
  description?: string
  capacity?: number
  startCoordinates?: [number, number]
  endCoordinates?: [number, number]

  constructor(data: Partial<Vehicle>) {
    Object.assign(this, data)
  }


}
