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
import {OidcSecurityService} from 'angular-auth-oidc-client';
import {Shipment} from '../models/Shipment';
import {ScenarioOptions} from '../models/ScenarioOptions';
import {Depot} from '../models/Depot';
import {ButtonComponent} from '../shared/components/button/button.component';
import {ToggleComponent} from '../shared/components/toggle/toggle.component';

@Component({
  selector: 'app-root',
  imports: [
    RouteDetailsComponent,
    NgIf,
    FormsModule,
    MapComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    ButtonComponent,
    ToggleComponent,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class SuCoLoMapComponent implements OnInit, OnDestroy {
  map!: Map;

  matchStreets: boolean = true
  shipmentsToGenerate: number = 10
  shipments: Shipment[] = []

  scenarioOptions = new ScenarioOptions({})

  readonly depots: Depot[] = [
    new Depot({
      id: 1,
      name: "Lützschena FULMO Micro-Hub",
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

  constructor(protected mapService: MapService, protected zone: NgZone, protected oidcSecurityService: OidcSecurityService) {
  }

  ngOnDestroy(): void {
    this.mapService.setMapLocation.unsubscribe()
  }

  ngOnInit(): void {
    this.scenarioOptions.depot = this.depots[0]
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
          ['case',
            ['all', ['has', 'stopIndex'], ['!=', ['get', 'stopIndex'], '']],
            ['concat', 'Stop: ', ['get', 'stopIndex'], '\n'],
            ''
          ],
          ['case',
            ['all', ['has', 'shipmentId'], ['!=', ['get', 'shipmentId'], '']],
            ['concat', 'Shipment: ', ['get', 'shipmentId'], '\n'],
            ''
          ],
          ['case',
            ['all', ['has', 'distance'], ['!=', ['get', 'distance'], '']],
            ['concat', 'Distance: ', ['get', 'distance'], 'km\n'],
            ''
          ],
          ['case',
            ['all', ['has', 'eta'], ['!=', ['get', 'eta'], '']],
            ['concat', 'ETA: ', ['get', 'eta']],
            ''
          ]
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
    this.sendRouteRequest(this.mapService.generateVroomRequest(this.vehicles, this.shipments, this.scenarioOptions), !this.matchStreets)
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
    this.shipments = this.mapService.generateShipments(this.scenarioOptions)
    this.polylinePoints = {
      type: 'FeatureCollection',
      features: this.shipments.flatMap((shipment) => {
        return [{
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: shipment.pickup.coordinates,
          },
          properties: {
            type: "pickup",
            shipmentId: shipment.id + 1,
          }
        },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: shipment.delivery.coordinates,
            },
            properties: {
              type: "delivery",
              shipmentId: shipment.id + 1,
            }
          }
        ]
      })
    }
  }
}
