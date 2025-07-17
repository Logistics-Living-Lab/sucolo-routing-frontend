import moment from 'moment/moment';
import {Feature, Point} from 'geojson';
import * as _ from "lodash";

export class RouteStep {
  id!: number
  type!: 'start' | 'job' | 'pickup' | 'delivery' | 'break' | 'end'
  description!: string
  location!: [number, number]
  setup!: number;
  service!: number;
  duration!: number;
  waiting_time!: number;
  priority!: number;
  distance!: number
  arrival!: number;
  violations!: any[];
  load!: number[];

  constructor(data: Partial<RouteStep>) {
    Object.assign(this, data)
  }

  getTotalDuration() {
    return this.setup + this.service + this.waiting_time
  }

  hasLocation(): boolean {
    return !_.isEmpty(this.location)
  }

  toGeoJsonFeature(stepIndex: number): Feature<Point> {

    const descriptionParts = []
    if (this.type === "start") {
      descriptionParts.push("Start")
    } else if (this.type === "end") {
      descriptionParts.push("End")
    } else if (this.type === "break") {
      descriptionParts.push("Break")
    } else {
      descriptionParts.push(`Shipment ${this.id + 1}`)
      descriptionParts.push(`${this.description}`)
      descriptionParts.push(`Stop: ${stepIndex + 1}`)
      descriptionParts.push(`Distance: ${Math.round(this.distance / 1000)} km`)
      descriptionParts.push(`ETA: ${moment().add(this.arrival, 'seconds').format('HH:mm')}`)
    }

    const description = _.join(descriptionParts, "\n")

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [this.location[0], this.location[1]],
      },
      properties: {
        type: this.type,
        description: description,
      }
    }
  }

}
