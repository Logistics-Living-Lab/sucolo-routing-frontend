export class VroomJobDto {
  id?: number;
  description?: string; //a string describing this job
  location?: [number, number] //lon, lat - coordinates array
  location_index?: number //index of relevant row and column in custom matrices
  setup: number = 0 // job setup duration (defaults to 0)
  service: number = 0 // job service duration (defaults to 0)
  setup_per_type?: any // object mapping vehicle types to job setup duration values
  service_per_type?: any // object mapping vehicle types to job service duration values
  delivery?: any // TODO define
  pickup?: any // TODO define
  skills?: [number] // an array of integers defining mandatory skills
  priority?: number = 0 //an integer in the [0, 100] range describing priority level (defaults to 0)
  time_windows: any // TODO define
}
