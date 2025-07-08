import {VroomTimeWindowDto} from "./VroomTypes"

class VroomCostDto {
  fixed: number = 0 // integer defining the cost of using this vehicle in the solution (defaults to 0)
  per_hour: number = 3600 // integer defining the cost for one hour of travel time with this vehicle (defaults to 3600)
  per_km: number = 0 // integer defining the cost for one km of travel time with this vehicle (defaults to 0)
}

class VroomBreakDto {
  id?: number
  description?: string // a string describing this break
  time_windows?: VroomTimeWindowDto[] // an array of time_window objects describing valid slots for break start
  service: number = 0 // break duration (defaults to 0)
  max_load?: number[][] // an array of integers describing the maximum vehicle load for which this break can happen
}

class VehicleStepDto {
  id?: number
  type?: 'start' | 'job' | 'pickup' | 'delivery' | 'break' | 'end'    // 	a string (either start, job, pickup, delivery, break or end)
  service_at?: VroomTimeWindowDto // hard constraint on service time
  service_after?: VroomTimeWindowDto // hard constraint on service time lower bound
  service_before?: VroomTimeWindowDto // hard constraint on service time upper bound
}

export class VroomVehicleDto {
  id?: number
  profile: string = "car" // routing profile (defaults to car)
  description?: string // a string describing this vehicle
  start?: [number, number] // coordinates array
  end?: [number, number] // coordinates array
  startIndex?: number // index of relevant row and column in custom matrices
  endIndex?: number // index of relevant row and column in custom matrices
  capacity?: [number] // an array of integers describing multidimensional quantities
  cost?: VroomCostDto // a cost object defining costs for this vehicle
  skills?: number[] // an array of integers defining skills
  type?: string // a string describing this vehicle type
  time_windows?: VroomTimeWindowDto[] // a time_window object describing working hours
  breaks?: VroomBreakDto[] // an array of break objects
  speed_factor?: number = 1.0 // a double value in the range (0, 5] used to scale all vehicle travel times (defaults to 1.), the respected precision is limited to two digits after the decimal point
  max_tasks?: number // an integer defining the maximum number of tasks in a route for this vehicle
  max_travel_time?: number // an integer defining the maximum travel time for this vehicle
  max_distance?: number // an integer defining the maximum distance for this vehicle
  steps?: VehicleStepDto[] // an array of vehicle_step objects describing a custom route for this vehicle

  constructor(data: Partial<VroomVehicleDto>) {
    Object.assign(this, data)
  }
}
