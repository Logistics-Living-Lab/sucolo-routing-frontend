import {RouteStep} from './RouteStep';
import {Feature, Point} from 'geojson';

export class AggregatedRouteStep {

  routeSteps: RouteStep[] = []

  protected getRouteStepWithLocation() {
    return this.routeSteps.find((routeStep: RouteStep) => routeStep.hasLocation())
  }

  hasLocation() {
    return this.getRouteStepWithLocation() !== undefined
  }

  toGeoJsonFeature(stepIndex: number): Feature<Point> {
    const routeStep = this.getRouteStepWithLocation()
    if (!routeStep) {
      throw new Error("RouteStep has no location")
    }
    return routeStep?.toGeoJsonFeature(stepIndex)
  }

  get type() {
    return this.routeSteps[0].type
  }

  get distance() {
    return this.routeSteps[0].distance
  }

  get description() {
    return this.routeSteps[0].description
  }

  get duration() {
    return this.routeSteps[0].duration
  }

  get arrival() {
    return this.routeSteps[0].arrival
  }

  get location() {
    return this.routeSteps[0].location
  }

  getTotalDuration() {
    return this.routeSteps[0].getTotalDuration()
  }




}
