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

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly VROOM_URL
  private readonly COUNT_SAMPLE_SHIPMENTS = 50

  private buildingsAsGeoJson!: FeatureCollection<Polygon>


  constructor(protected httpClient: HttpClient, configService: ConfigService) {
    this.VROOM_URL = configService.getVroomUrl()
    this.loadBuildingsAsGeoJson()
      .subscribe(buildings => this.buildingsAsGeoJson = buildings)
  }

  setMapLocation: EventEmitter<any> = new EventEmitter()

  calculateRoute(requestBody: any): Observable<Route[]> {
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

  generateSampleRequest(vehicles: Vehicle[] = [], countShipments = this.COUNT_SAMPLE_SHIPMENTS) {
    const shipments = []

    for (let i = 0; i < countShipments; i++) {
      const pickUpLocation = this.getRandomBuildingAsLocation()
      const deliveryLocation = this.getRandomBuildingAsLocation()

      const shipment = {
        "pickup": {
          "id": i,
          "location": pickUpLocation?.coordinates,
          "description": pickUpLocation?.name,
          "service": 60,
          "amount": [1]

        },
        "delivery": {
          "id": i,
          "location": deliveryLocation?.coordinates,
          "description": deliveryLocation?.name,
          "amount": [1]
        }
      }

      shipments.push(shipment)
    }

    return {
      "shipments": shipments,
      "vehicles": vehicles.map(vehicle => {
        return {
          id: vehicle.id,
          start: [
            12.324161,
            51.322871
          ],
          description: `${vehicle.type} ${vehicle.id}`,
          max_tasks: _.ceil((shipments.length * 2) / vehicles.length),
          profile: vehicle.type,
          speed_factor: 1.0
        }
      }),
      "options": {
        "g": true
      }
    }
  }

  generateSampleRequestJobs(vehicles: Vehicle[] = [], countJobs = this.COUNT_SAMPLE_SHIPMENTS) {
    const jobs = []

    for (let i = 0; i < countJobs; i++) {
      const pickUpLocation = this.getRandomBuildingAsLocation()

      const job = {
        "id": i,
        "location": pickUpLocation?.coordinates,
        "description": pickUpLocation?.name,
        "service": 60,
      }

      jobs.push(job)
    }

    return {
      "jobs": jobs,
      "vehicles": vehicles.map(vehicle => {
        return {
          id: vehicle.id,
          start: [
            12.324161,
            51.322871
          ],
          description: `${vehicle.type} ${vehicle.id}`,
          max_tasks: _.ceil(jobs.length / vehicles.length),
          profile: vehicle.type,
          speed_factor: 1.0
        }
      }),
      "options": {
        "g": true
      }
    }
  }

  generateSampleRequestJobsLimited(vehicles: Vehicle[] = [], countShipments = this.COUNT_SAMPLE_SHIPMENTS) {
    // const vehicle = {
    //   "id": 1,
    //   "start": [
    //     12.324161,
    //     51.322871
    //   ],
    //   "startDescription": "Klingenstraße 22, 04229 Leipzig",
    //   "description": "Cargo Bike 3 (max 4 Boxes)",
    //   "speed_factor": 1.0,
    //   "breaks": [{
    //     id: 1,
    //     service: 1800,
    //     time_windows: [[3600, 3 * 3600]],
    //   }],
    //   "capacity": [4],
    //   "profile": "bike",
    // }

    const shipments = []
    const startLocation = [
      12.324161,
      51.322871
    ]

    for (let i = 0; i < countShipments; i++) {
      const deliveryLocation = this.getRandomBuildingAsLocation()


      const shipment = {
        "pickup": {
          "id": i,
          "location": startLocation,
          "description": "Klingenstraße 22, 04229 Leipzig",
          "service": 60,
        },
        "delivery": {
          "id": i,
          "location": deliveryLocation?.coordinates,
          "description": deliveryLocation?.name,
        },
        "amount": [1],
        "priority": countShipments - i
      }

      shipments.push(shipment)
    }
    return {
      "shipments": shipments,
      "vehicles": vehicles.map(vehicle => {
        return {
          id: vehicle.id,
          start: startLocation,
          description: `${vehicle.type} ${vehicle.id}`,
          capacity: [4],
          max_tasks: _.ceil((shipments.length * 2) / vehicles.length),
          profile: vehicle.type,
          speed_factor: 1.0
        }
      }),
      "options": {
        "g": true
      }
    }
  }

  generateSampleRequestLuetzschena(vehicles: Vehicle[] = [], countShipments = this.COUNT_SAMPLE_SHIPMENTS) {
    const startLocation = [
      12.271092975398838,
      51.383806427138865,
    ]

    const vehicle = {
      "id": 1,
      "start": startLocation,
      "startDescription": "Elsterberg 6-10, 04159 Leipzig",
      "description": "Cargo Bike 4 (max 2 Boxes)",
      "speed_factor": 1.0,
      "breaks": [{
        id: 1,
        service: 1800,
        time_windows: [[3600, 3 * 3600]],
      }],
      "capacity": [2],
      "profile": "bike",
    }

    const shipments = []

    for (let i = 0; i < countShipments; i++) {
      const deliveryLocation = this.getRandomBuildingAsLocation()

      const shipment = {
        "pickup": {
          "id": i,
          "location": startLocation,
          "description": vehicle.startDescription,
          "service": 60,
        },
        "delivery": {
          "id": i,
          "location": deliveryLocation?.coordinates,
          "description": deliveryLocation?.name,
        },
        "amount": [1],
        "priority": countShipments - i
      }

      shipments.push(shipment)
    }
    return {
      "shipments": shipments,
      "vehicles": vehicles.map(vehicle => {
        return {
          id: vehicle.id,
          start: startLocation,
          description: `${vehicle.type} ${vehicle.id}`,
          capacity: [2],
          max_tasks: _.ceil((shipments.length * 2) / vehicles.length),
          profile: vehicle.type,
          speed_factor: 1.0
        }
      }),
      "options": {
        "g": true
      }
    }
  }


  // const jobs = []
  //
  // for (let i = 0; i < countJobs; i++) {
  //   const pickUpLocation = this.getRandomBuildingAsLocation()
  //
  //   const job = {
  //     "id": i,
  //     "location": pickUpLocation?.coordinates,
  //     "description": pickUpLocation?.name,
  //     "service": 60,
  //     "delivery": [1],
  //   }
  //
  //   jobs.push(job)
  // }


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
