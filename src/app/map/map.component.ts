import {Component, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import * as polyline from '@mapbox/polyline'
import {Feature, GeoJSON, GeoJsonProperties, LineString, Point, Polygon} from 'geojson';
import {concatMap, count, from, map, Observable, of} from 'rxjs';
import {MapboxEvent, MapMouseEvent, Map, Expression, Anchor} from 'mapbox-gl';
import moment from 'moment';
import * as _ from "lodash";

import {RouteDetailsComponent} from '../route-details/route-details.component';
import {NgForOf, NgIf} from '@angular/common';
import {Route} from '../models/Route';
import {MapService} from './map.service';
import {FormsModule} from '@angular/forms';
import {RouteUtil} from '../models/RouteUtil';
import {Vehicle} from '../models/Vehicle';
import {GeoJSONSourceComponent, LayerComponent, MapComponent} from 'ngx-mapbox-gl';

@Component({
  selector: 'app-root',
  imports: [
    RouteDetailsComponent,
    NgIf,
    FormsModule,
    MapComponent,
    GeoJSONSourceComponent,
    LayerComponent,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class SuCoLoMapComponent implements OnInit, OnDestroy {
  map!: Map;

  matchStreets: boolean = true

  constructor(protected mapService: MapService, protected zone: NgZone) {
  }

  ngOnDestroy(): void {
    this.mapService.setMapLocation.unsubscribe()
  }

  ngOnInit(): void {
    this.mapService.setMapLocation.subscribe(
      (location: any) => this.onNewMapLocationReceived(location)
    )
  }

  title = 'sucolo-routing-frontend';
  polylineData: GeoJSON.FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: "LineString",
        coordinates: []
      },
      properties: {}
    }]
  }

  polylinePoints: GeoJSON.FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: "Point",
        coordinates: []
      },
      properties: {}
    }]
  }

  polylineLayerStyle = {
    paint: {
      'line-color': '#79FFFE',
      'line-width': 3,
      // 'line-gradient': [
      //   'interpolate',
      //   ['linear'],
      //   ['line-progress'],
      //   0,
      //   'blue',
      //   0.1,
      //   'royalblue',
      //   0.3,
      //   'cyan',
      //   0.5,
      //   'lime',
      //   0.7,
      //   'yellow',
      //   1,
      //   'red'
      // ]
    }
  }

  pointLayerStyle = {
    paint: {
      'icon-color': [
        'match',
        ['get', 'type'],
        'start', '#ff0000',
        'pickup', '#FE53BB',
        'delivery', '#FCFF03',
        'job', '#FCFF03',
        '#000000'
      ] as Expression,
      'text-color': '#000000',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
    layout: {
      'icon-image': [
        'match',
        ['get', 'type'],
        'start', 'bicycle',
        'triangle'
      ] as Expression,
      'icon-size': 0.8,
      'icon-rotate': [
        'match',
        ['get', 'type'],
        'delivery', 90,
        'job', 90,
        'pickup', -90,
        0
      ] as Expression,
      'text-field': [
        'match',
        ['get', 'type'],
        'start', 'Start',
        ['concat',
          'Stop: ', ['get', 'stopIndex'],
          '\nShipment: ', ['get', 'shipmentId'],
          '\nDistance: ', ['get', 'distance'], 'km',
          '\nETA: ', ['get', 'eta']
        ]
      ] as Expression,
      'text-size': 16,
      'text-font': ['Open Sans Bold'],
      'text-offset': [0, 2],
      'icon-ignore-placement': true,
      'text-anchor': 'top' as Anchor,
      'text-ignore-placement': true,
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
    }
  }

  buildingGeojson!: GeoJSON.FeatureCollection<Polygon>

  vehicles: Vehicle[] = [
    new Vehicle({id: 1, type: "bike"}),
  ]

  routes: Route[] = []
  route: Route | null = null


  buildingLayerStyle = {
    paint3d: {

      // 'fill-extrusion-color': 'rgba(45, 234, 33, 0.5)', // Semi-transparent fill color
      'fill-extrusion-color':
        ['get', 'color'] as Expression,
      // 'fill-extrusion-outline-color': '#000000', // Outline color for the buildings
      'fill-extrusion-height': [
        '*',
        ['to-number', ['get', 'building:levels']],
        7.0
      ] as Expression,
      'fill-extrusion-opacity': 0.8
    },
    paint: {
      'fill-color': 'rgba(200, 100, 240, 0.5)', // Semi-transparent fill color
      'fill-outline-color': '#000000', // Outline color for the buildings
    },
    layout: {
      visibility: 'visible' // Controls layer visibility
    }
  }

  onMapClick($event: MapMouseEvent) {
    $event.preventDefault()
    $event.originalEvent.stopPropagation()

  }


  onMapReady(event: MapboxEvent) {
    this.map = event.target
    of(['package', 'triangle'])
      .pipe(
        concatMap((iconNames: string[]) => {
          // Use `from()` to create an observable for each icon name to load them one by one
          return from(iconNames).pipe(
            concatMap(iconName => this.loadIcon(iconName))
          );
        })
      )
      .subscribe({
        next: () => {
          console.log('Icon loaded');
        },
        error: (err) => {
          console.error('Error loading icons', err);
        },
        complete: () => {
          console.log('All icons loaded');
        }
      })

    this.buildingGeojson = this.mapService.getBuildings()
  }

  loadIcon(iconName: string) {
    return new Observable<void>((observer) => {
      console.log(iconName)
      this.map.loadImage(`assets/${iconName}.png`, (error, image) => {
        if (error) {
          observer.error(error);
          return;
        }

        if (image) {
          this.map.addImage(iconName, image, {sdf: true});
          observer.next();
          observer.complete();
        } else {
          observer.error(new Error('Image not loaded'));
        }
      });
    });
  }

  onScenario1Click($event: MouseEvent) {
    this.sendRouteRequest(this.mapService.generateSampleRequest(this.vehicles), !this.matchStreets)
  }

  onScenario2Click($event: MouseEvent) {
    this.sendRouteRequest(this.mapService.generateSampleRequestJobs(this.vehicles), !this.matchStreets)
  }

  onScenario3Click($event: MouseEvent) {
    this.sendRouteRequest(this.mapService.generateSampleRequestJobsLimited(this.vehicles), !this.matchStreets)
  }

  onScenario4Click($event: MouseEvent) {
    this.sendRouteRequest(this.mapService.generateSampleRequestLuetzschena(this.vehicles), !this.matchStreets)
  }

  protected sendRouteRequest(requestBody: any, directLine = false) {
    this.mapService.calculateRoute(requestBody)
      .subscribe((routes) => {
        //Only first route at the moment

        routes.forEach((route) => route.optimize())
        this.routes = routes
        this.updateSelectedRoute(this.routes[0])

      })
  }

  private onNewMapLocationReceived(coordinates: any) {
    this.map.flyTo({
      center: coordinates as [number, number],
      zoom: 18
    })
  }

  onMatchStreetsChanged($event: Event) {
    console.log(this.matchStreets)
  }

  protected readonly RouteUtil = RouteUtil;

  updateSelectedRoute(route: Route) {
    this.route = route
    if (this.matchStreets) {
      this.polylineData = route.getGeometryAsGeoJson()
    } else {
      this.polylineData = route.getGeometryDirectAsGeoJson()
    }
    this.polylinePoints = route.getStepsAsGeoJsonFeatures()

  }

  onRouteClicked(route: Route) {
    this.updateSelectedRoute(route)
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
    this.routes = []
    this.route = null
  }

  getVehicleById(id: number) {
    return _.find(this.vehicles, {id: id})
  }

  onVehicleRemove(vehicle: Vehicle) {
    _.remove(this.vehicles, {id: vehicle.id})
    this.routes = []
    this.route = null
  }
}
