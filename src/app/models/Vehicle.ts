export class Vehicle {

  constructor(data: Partial<Vehicle>) {
    Object.assign(this, data)
  }

  id!: number;
  type!: "car" | "bike"
  max_tasks?: number;
}
