export class Shipment {
  id!: number;
  shipmentNumber!: string;
  pickup!: {
    addressName: string,
    coordinates: [number, number],
    serviceTimeSeconds: number
  }
  delivery!: {
    addressName: string
    coordinates: [number, number],
    serviceTimeSeconds: number
  }
  amount: number = 1

  constructor(data: Partial<Shipment>) {
    Object.assign(this, data)
  }
}
