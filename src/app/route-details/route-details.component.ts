import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DecimalPipe, JsonPipe, NgForOf, NgIf} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {map, tap} from 'rxjs';
import moment from 'moment';
import {Route} from '../models/Route';
import {MapService} from '../map/map.service';
import {RouteStep} from '../models/RouteStep';
import {AggregatedRouteStep} from '../models/AggregatedRouteStep';
import * as _ from "lodash";
import {RouteUtil} from '../models/RouteUtil';

@Component({
  selector: 'app-route-details',
  imports: [
    JsonPipe,
    NgIf,
    NgForOf,
    DecimalPipe
  ],
  templateUrl: './route-details.component.html',
  styleUrl: './route-details.component.css'
})
export class RouteDetailsComponent {

  @Input()
  route!: Route

  isDebugMode = false

  constructor(protected activatedRoute: ActivatedRoute, protected httpClient: HttpClient, protected mapService: MapService) {
    this.isDebugMode = activatedRoute.snapshot.data['debug'] === true
    if (this.isDebugMode) {
      this.httpClient.get("assets/debug-data/01-dummy-route-response.json")
        .pipe(
          tap((data) => console.log(data)),
          map((data: any) => {
            data.routes = data.routes.map((routeData: any) => new Route(routeData))
            return data
          })
        )
        .subscribe((data: any) => this.route = data.routes[0])
    }
  }

  getRouteDurationString(durationInSeconds: number) {
    return moment.utc(moment.duration(durationInSeconds, "seconds").asMilliseconds()).format("HH:mm")
  }

  getEta(durationInSeconds: number) {
    return moment().add(durationInSeconds, 'seconds').format("HH:mm")
  }

  getNowAsString() {
    return moment().format("HH:mm")
  }

  getAverageSpeedInKph(step: any) {
    return (step.distance / step.duration) * 3.6
  }

  protected readonly moment = moment;

  getMaterialIconForStepType(type: string) {
    switch (type) {
      case 'start' :
        return 'trip_origin'
      case 'pickup':
        return 'package_2'
      case 'break':
        return 'coffee'
      case 'job':
      case 'delivery':
        return 'home'
      case 'end' :
        return 'flag_circle'
      default:
        return 'none'
    }
  }

  getHeaderForStep(step: any) {
    if (step instanceof AggregatedRouteStep) {
      return `Shipments: ` + _.join(step.routeSteps?.map(routeStep => routeStep.id + 1), ", ")
    }
    switch (step.type) {
      case 'start' :
        return 'Start'
      case 'pickup':
        return 'Pick Up: Shipment ' + (step.id + 1)
      case 'break':
        return 'Break'
      case 'job':
      case 'delivery':
        return 'Delivery: Shipment ' + (step.id + 1)
      case 'end' :
        return 'Route finished'
      default:
        return 'none'
    }
  }

  onButtonClicked(step: RouteStep | AggregatedRouteStep) {
    this.mapService.setMapLocation.next(step.location)
  }

  protected readonly RouteUtil = RouteUtil;
}
