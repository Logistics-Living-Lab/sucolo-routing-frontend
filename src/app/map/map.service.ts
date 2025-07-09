import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Route} from '../models/Route';
import {forkJoin, map, Observable} from 'rxjs';
import * as _ from 'lodash';
import {Feature, FeatureCollection, GeoJSON, Polygon} from 'geojson';
import * as turf from "@turf/turf";
import proj4 from "proj4";
import {Vehicle} from '../models/Vehicle';
import {ConfigService} from '../config/config.service';
import {OidcSecurityService} from 'angular-auth-oidc-client';
import {VroomDto} from '../models/VroomDto';
import {VroomShipmentStepDto} from '../models/VroomShipmentStepDto';
import {VroomJobDto} from '../models/VroomJobDto';
import {VroomShipmentDto} from '../models/VroomShipmentDto';
import {Shipment} from '../models/Shipment';
import {VroomVehicleDto} from '../models/VroomVehicleDto';
import {ScenarioOptions} from '../models/ScenarioOptions';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly VROOM_URL
  private readonly COUNT_SAMPLE_SHIPMENTS = 50
  private readonly DEFAULT_MAX_CAPACITY = 4

  private buildingsAsGeoJson!: FeatureCollection<Polygon>


  constructor(protected httpClient: HttpClient, configService: ConfigService) {
    this.VROOM_URL = configService.getVroomUrl()
    this.loadBuildingsAsGeoJson()
      .subscribe(buildings => this.buildingsAsGeoJson = buildings)
  }

  setMapLocation: EventEmitter<any> = new EventEmitter()

  calculateRoute(requestBody: VroomDto): Observable<Route[]> {
    return this.httpClient.post(this.VROOM_URL, requestBody).pipe(
      map(this.transformResponseToRoute)
    )
  }

  transformResponseToRoute(vroomResponse: any): Route[] {
    return vroomResponse.routes.map((vroomRoute: any) => new Route(vroomRoute))
  }

  getBuildings() {
    return this.buildingsAsGeoJson
  }

  getRandomBuildingAsLocation() {
    while (true) {
      const building = _.sample(this.buildingsAsGeoJson.features)
      if (building
        && building.properties !== null
        && building.properties['addr:street']
        && building.properties['addr:housenumber']
        && building.properties['addr:postcode']
        && building.properties['addr:city']
      ) {
        return {
          coordinates: turf.centroid(building).geometry.coordinates,
          name: `${building.properties['addr:street']} ${building.properties['addr:housenumber']}, ${building.properties['addr:postcode']} ${building.properties['addr:city']} `
        }
      }
    }
  }

  generateShipments(scenarioOptions: ScenarioOptions) {
    const shipments: Shipment[] = []
    for (let i = 0; i < scenarioOptions.randomShipmentsCount; i++) {
      let pickUpLocation
      if (scenarioOptions.deliverShipmentsFromDepot && !!scenarioOptions.depot) {
        pickUpLocation = scenarioOptions.depot
      } else {
        pickUpLocation = this.getRandomBuildingAsLocation()
      }

      //CHECK
      if (!pickUpLocation || !pickUpLocation.name || !pickUpLocation.coordinates) {
        throw new Error("pickuplocation not set")
      }


      const deliveryLocation = this.getRandomBuildingAsLocation()


      const shipment: Shipment = new Shipment({
        id: i,
        pickup: {
          coordinates: [pickUpLocation.coordinates[0], pickUpLocation.coordinates[1]],
          addressName: pickUpLocation.name,
          serviceTimeSeconds: 60
        },
        delivery: {
          coordinates: [deliveryLocation?.coordinates[0], deliveryLocation?.coordinates[1]],
          addressName: deliveryLocation?.name,
          serviceTimeSeconds: 60
        },
        amount: 1
      })
      shipments.push(shipment)
    }

    return shipments
  }

  generateVroomRequest(vehicles: Vehicle[] = [], shipments: Shipment[] = [], scenarioOptions: ScenarioOptions): VroomDto {
    const shipmentDtos: VroomShipmentDto[] = shipments.map(shipment => {
      return new VroomShipmentDto({
        pickup: {
          id: shipment.id,
          location: shipment.pickup.coordinates,
          description: shipment.pickup.addressName,
          service: shipment.pickup.serviceTimeSeconds
        },
        delivery: {
          id: shipment.id,
          location: shipment.delivery.coordinates,
          description: shipment.delivery.addressName,
          service: shipment.delivery.serviceTimeSeconds
        },
        amount: [shipment.amount]
      })
    })

    if (scenarioOptions.autoAssignTasks) {
      vehicles.forEach(vehicle => {
        vehicle.maxTasks = _.ceil((shipments.length * 2) / vehicles.length)
      })
    }

    const vehicleDtos: VroomVehicleDto[] = vehicles.map(vehicle => {
      const vehicleDto = new VroomVehicleDto({
        id: vehicle.id,
        start: scenarioOptions.depot?.coordinates,
        description: `${vehicle.type} ${vehicle.id}`,
        max_tasks: vehicle.maxTasks,
        profile: vehicle.type,
        speed_factor: vehicle.speedFactor,
      })


      return vehicleDto
    })

    if (scenarioOptions.vehicleCapacity) {
      vehicleDtos.forEach(vehicleDto => {
        vehicleDto.capacity = [this.DEFAULT_MAX_CAPACITY]
      })
    }
    //Remove capacity on shipments when not needed - otherwise VROOM throws error
    else {
      _.forEach(shipmentDtos, shipmentDto => {
        delete shipmentDto.amount;
      });
    }

    return new VroomDto({
      shipments: shipmentDtos,
      vehicles: vehicleDtos,
      options: {
        "g": true
      }
    })
  }

  protected loadBuildingsAsGeoJson() {
    proj4.defs("EPSG:25833", "+proj=utm +zone=33 +datum=ETRS89 +units=m +no_defs");
    return forkJoin([
        this.httpClient.get<FeatureCollection<Polygon>>("assets/buildings-04159.geojson"),
        this.httpClient.get<FeatureCollection<Polygon>>("assets/leipzig-districts.geojson")
      ]
    ).pipe(
      map(([buildings, districts]) => {

        // Transform the GeoJSON - ChatGPT generated
        const districtsNew = {
          ...districts, // Copy the original object
          features: districts.features.map(district => ({
            ...district,
            geometry: {
              ...district.geometry,
              coordinates: district.geometry.coordinates.map(polygonCoordinates =>
                polygonCoordinates.map(position => proj4("EPSG:25833", "EPSG:4326", position))
              ),
            }
          }))
        };


        // Convert from EPSG:25833 to EPSG:4326 (WGS84)
        buildings.features = buildings.features.map((feature: any) => {
          feature.properties.color = this.getRandomColor()
          if (!feature.properties['building:levels']) {
            feature.properties['building:levels'] = 2
          }
          return feature
        })

        const luetzschenaDistrict = _.find(districtsNew.features,
          (district) => {
            return district.properties?.['Name'] === "Lützschena-Stahmeln"
          }
        )
        if (luetzschenaDistrict) {
          buildings.features = buildings.features.filter(building => turf.booleanWithin(building, luetzschenaDistrict))
        }
        return buildings
      })
    )
  }

  getRandomColor() {
    // const startColor = "#33FF00"
    // const endColor = "#006600"

    const startColor = "#FCFF55"
    const endColor = "#FF5E5E"

    const availableColors = 5

    const factor = _.random(1, availableColors)

    return this.blendColors(startColor, endColor, 1.0 / factor)
  }

  //ChatGPT generated
  blendColors(color1: string, color2: string, percentage: number) {
    let c1 = parseInt(color1.slice(1), 16),
      c2 = parseInt(color2.slice(1), 16);
    let r = (1 - percentage) * (c1 >> 16) + percentage * (c2 >> 16),
      g = (1 - percentage) * ((c1 >> 8) & 0xff) + percentage * ((c2 >> 8) & 0xff),
      b = (1 - percentage) * (c1 & 0xff) + percentage * (c2 & 0xff);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

}
