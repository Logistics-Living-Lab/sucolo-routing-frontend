import {Depot} from './Depot';

export class ScenarioOptions {
  depot: Depot | undefined
  deliverShipmentsFromDepot: boolean = true
  vehicleCapacity: number | undefined
  autoAssignTasks: boolean = true
  randomShipmentsCount = 10

  constructor(data: Partial<ScenarioOptions>) {
    Object.assign(this, data)
  }
}
