import {RouteStep} from './RouteStep';
import * as polyline from '@mapbox/polyline';
import {FeatureCollection, GeoJSON, LineString, Point} from 'geojson';
import {AggregatedRouteStep} from './AggregatedRouteStep';
import * as _ from "lodash";

export class Route {
  vehicle!: number;
  cost!: number;
  setup!: number;
  service!: number;
  duration!: number;
  waiting_time!: number;
  priority!: number;
  distance!: number
  steps: Array<RouteStep | AggregatedRouteStep> = []
  violations!: any[]
  geometry!: string
  description!: string

  constructor(data: Partial<Route>) {
    if (data.steps) {
      data.steps = data.steps.map((stepData: any) => new RouteStep(stepData))
    }
    Object.assign(this, data)
  }

  getTotalDuration() {
    return this.setup + this.service + this.duration + this.waiting_time
  }

  getGeometryAsGeoJson(): FeatureCollection<LineString> {
    const coordinates = polyline.decode(this.geometry)
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: "LineString",
          coordinates: coordinates.map((point) => [point[1], point[0]])
        },
        properties: {}
      }]
    }
  }

  getGeometryDirectAsGeoJson(): FeatureCollection<LineString> {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: "LineString",
          coordinates: this.steps
            .filter(step => step.hasLocation())
            .map((step, index) => step.location)
        },
        properties: {}
      }]
    }
  }

  getStepsAsGeoJsonFeatures(): FeatureCollection<Point> {
    return {
      type: 'FeatureCollection',
      features: this.steps
        .filter(step => step.hasLocation())
        .map((step, index) => step.toGeoJsonFeature(index))
    }
  }

  findDeliveryFollowedByPickup(route: Route): number[] {
    const indices: number[] = [];

    for (let i = 0; i < this.steps.length - 1; i++) {
      if (this.steps[i].type === "delivery" && this.steps[i + 1].type === "pickup") {
        indices.push(i + 1);
      }
    }

    return indices;
  }

  splitArray(arr: any[], indices: number[]): any[][] {
    const result: any[][] = [];
    let start = 0;

    indices.forEach((index) => {
      result.push(arr.slice(start, index));
      start = index;
    });

    result.push(arr.slice(start)); // Adding the last chunk
    return result;
  }

  optimize() {
    const reloadIndices = this.findDeliveryFollowedByPickup(this)
    const legs = this.splitArray(this.steps, reloadIndices)
    console.log(legs)

    legs.forEach((leg, legIndex) => {
      const pickups = leg.filter((routeStep) => routeStep.type === 'pickup')
      const deliveries = leg.filter((routeStep) => routeStep.type === 'delivery')
      const notDeliveredShipments = _.differenceBy(pickups, deliveries, 'id')

      notDeliveredShipments.forEach((pickup) => {

        // Find the leg where this shipment is actually delivered
        const deliveryLegIndex = legs.findIndex((leg) =>
          leg.some((step) => step.type === 'delivery' && step.id === pickup.id)
        );

        if (deliveryLegIndex !== -1 && deliveryLegIndex > legIndex) {
          console.log(`🚀 Moving pickup of shipment ${pickup.id} from leg ${legIndex} to leg ${deliveryLegIndex}`);

          // Remove pickup from current leg
          console.log(legs[legIndex])
          legs[legIndex] = legs[legIndex].filter((step) => !(step.id === pickup.id && step.type === "pickup"));
          console.log(legs[legIndex])

          // Add pickup to the correct delivery leg
          legs[deliveryLegIndex].unshift(pickup);
        }
      });
    })

    this.steps = _.flatten(legs)

    // this.steps
    //   .filter(step => step instanceof RouteStep)
      // .forEach((routeStep) => {
      //   console.log(routeStep.load)
      //   console.log(routeStep.location)
      // })

    const mergedSteps = _.reduce(
      this.steps.filter(step => step instanceof RouteStep),
      (result: Array<RouteStep | AggregatedRouteStep>, current) => {
        const last = result[result.length - 1];

        if (last && last.description === current.description && last.type === current.type) {
          // Merge consecutive elements
          let aggregatedRouteStep
          if (last instanceof AggregatedRouteStep) {
            aggregatedRouteStep = last
          } else {
            aggregatedRouteStep = new AggregatedRouteStep()
            aggregatedRouteStep.routeSteps.push(last)
            result.pop()
            result.push(aggregatedRouteStep)
          }
          aggregatedRouteStep.routeSteps.push(current)

        } else {
          result.push(current); // Add a new element
        }

        return result;
      }, [] as Array<RouteStep | AggregatedRouteStep>);

    this.steps = mergedSteps
  }
}
