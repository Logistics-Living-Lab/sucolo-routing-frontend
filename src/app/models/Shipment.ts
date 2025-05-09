export class Shipment {
  id!: number;
  shipmentNumber!: string;
  pickup!: {
    addressName: string
    coordinates: [number, number]
  }
  delivery!: {
    addressName: string
    coordinates: [number, number]
  }
}
