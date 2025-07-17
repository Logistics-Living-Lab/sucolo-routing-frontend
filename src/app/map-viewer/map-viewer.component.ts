import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Map} from 'mapbox-gl';
import * as _ from "lodash";

import {RouteDetailsComponent} from '../route-details/route-details.component';
import {NgIf} from '@angular/common';
import {Route} from '../models/Route';
import {FormsModule} from '@angular/forms';
import {RouteUtil} from '../models/RouteUtil';
import {Vehicle} from '../models/Vehicle';
import {Shipment} from '../models/Shipment';
import {ScenarioOptions} from '../models/ScenarioOptions';
import {Depot} from '../models/Depot';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {MatButton} from '@angular/material/button';
import {VehicleFormButtonComponent} from './vehicle-form-button/vehicle-form-button.component';
import {AppMapService} from '../map/app-map.service';
import {AppMapComponent} from '../map/app-map.component';
import {VroomService} from '../vroom/vroom.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import moment from 'moment';

@Component({
  selector: 'app-root',
  imports: [
    RouteDetailsComponent,
    NgIf,
    FormsModule,
    AppMapComponent,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatSlideToggle,
    MatSlider,
    MatSliderThumb,
    MatButton,
    VehicleFormButtonComponent,
    AppMapComponent,
    MatProgressSpinner,
  ],
  templateUrl: './map-viewer.component.html',
  styleUrl: './map-viewer.component.css'
})
export class MapViewerComponent implements OnInit, OnDestroy {
  map!: Map;

  matchStreets: boolean = true
  shipments: Shipment[] = []
  routes: Route[] = []
  selectedRoute: Route | undefined
  vehicles: Vehicle[] = []
  scenarioOptions = new ScenarioOptions({})
  isCalculatingRoute: boolean = false

  readonly depots: Depot[] = [
    new Depot({
      id: 1,
      name: "FULMO Lützschena Micro-Hub",
      addressName: "Elsterberg 6-10, 04159 Leipzig",
      coordinates: [
        12.271092975398838,
        51.383806427138865,
      ] as [number, number]
    }),
    new Depot({
      id: 2,
      name: "FULMO Plagwitz Depot",
      addressName: "Klingenstraße 22, 04229 Leipzig",
      coordinates: [
        12.324161,
        51.322871
      ] as [number, number]
    }),
  ]

  protected readonly RouteUtil = RouteUtil;

  constructor(
    protected mapService: AppMapService,
    protected zone: NgZone,
    protected vroomService: VroomService
  ) {
  }

  ngOnDestroy(): void {
    this.mapService.setMapLocation.unsubscribe()
  }

  ngOnInit(): void {
    this.scenarioOptions.depot = this.depots[0]
    this.onVehicleAdd("bike")
  }

  onMapReady() {

  }

  onCalculateRouteClick($event: MouseEvent) {
    this.isCalculatingRoute = true
    this.vroomService.sendVroomRequest(this.vehicles, this.shipments, this.scenarioOptions)
      .subscribe({
        next: (routes) => {
          this.routes = routes
          //Only first route at the moment
          this.updateSelectedRoute(this.routes[0])
        },
        error: (error) => {
          console.error(error)
        },
        complete: () => this.isCalculatingRoute = false
      })
  }

  onMatchStreetsChanged($event: any) {
    if (this.selectedRoute) {
      this.mapService.displayRoute(this.selectedRoute, this.matchStreets, this.scenarioOptions.deliverShipmentsFromDepot)
    }
  }

  onRouteClicked(route: Route) {
    this.updateSelectedRoute(route)
  }

  updateSelectedRoute(route: Route | undefined) {
    this.selectedRoute = route
    if (route) {
      this.mapService.displayRoute(route, this.matchStreets, this.scenarioOptions.deliverShipmentsFromDepot)
    } else {
      this.mapService.resetPolyline()
    }
  }

  getImageSrcForVehicle(vehicle: Vehicle | undefined) {
    if (vehicle?.type === "bike") {
      return "assets/cargo-bike.png"
    }
    if (vehicle?.type === "car") {
      return "assets/delivery.png"
    }
    return null
  }

  onVehicleAdd(type: 'car' | 'bike') {
    this.vehicles.push(new Vehicle({
      id: this.vehicles.length + 1,
      type: type
    }))
  }

  getVehicleById(id: number) {
    return _.find(this.vehicles, {id: id})
  }

  getVehicleByType(type: string) {
    return _.filter(this.vehicles, {type: type})
  }

  onVehicleRemove(type: string) {
    const lastVehicle: Vehicle | undefined = _.findLast(this.vehicles, {type: type}) as Vehicle | undefined
    if (lastVehicle) {
      _.remove(this.vehicles, {id: lastVehicle.id})
    }
  }

  onGenerateShipmentsClick($event: MouseEvent) {
    this.updateSelectedRoute(undefined)
    this.routes = []
    this.shipments = this.mapService.generateShipments(this.scenarioOptions)
    this.mapService.displayShipments(this.shipments, this.scenarioOptions.deliverShipmentsFromDepot)
  }

  isRouteCalculationEnabled() {
    return !_.isEmpty(this.scenarioOptions.depot)
      && !_.isEmpty(this.shipments)
      && this.vehicles.length > 0
      && !this.isCalculatingRoute
  }
}
