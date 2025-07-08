export class VroomShipmentStepDto {
  id?: number;
  description?: string; //a string describing this step
  location?: [number, number] //lon, lat - coordinates array
  location_index?: number //index of relevant row and column in custom matrices
  setup?: number = 0 // job setup duration (defaults to 0)
  service?: number = 0 // job service duration (defaults to 0)
  setup_per_type?: any // object mapping vehicle types to job setup duration values
  service_per_type?: any // object mapping vehicle types to job service duration values
  time_windows?: any // TODO define
}
