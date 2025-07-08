export class Depot {
  id?: number
  name?: string
  addressName?: string
  coordinates: [number, number] | undefined

  constructor(data: Partial<Depot>) {
    Object.assign(this, data)
  }
}
