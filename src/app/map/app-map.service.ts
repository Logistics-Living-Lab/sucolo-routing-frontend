import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Route} from '../models/Route';
import {forkJoin, map, Observable, Subject} from 'rxjs';
import * as _ from 'lodash';
import {Feature, FeatureCollection, GeoJSON, LineString, Point, Polygon} from 'geojson';
import * as turf from "@turf/turf";
import proj4 from "proj4";
import {Shipment} from '../models/Shipment';
import {ScenarioOptions} from '../models/ScenarioOptions';

@Injectable({
  providedIn: 'root'
})
export class AppMapService {

  private buildingsAsGeoJson!: FeatureCollection<Polygon>


  constructor(protected httpClient: HttpClient) {

    this.loadBuildingsAsGeoJson()
      .subscribe(buildings => this.buildingsAsGeoJson = buildings)
  }

  setMapLocation: EventEmitter<any> = new EventEmitter()
  updateLayerData$: Subject<{ layerId: string, data: FeatureCollection<Point | LineString> }> = new Subject()

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

  transformShipmentsToGeoJsonPoints(shipments: Shipment[]): FeatureCollection<Point> {
    return {
      type: 'FeatureCollection',
      features: shipments.flatMap((shipment) => {
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

  displayShipments(shipments: Shipment[]) {
    this.updateLayerData$.next({layerId: "points", data: this.transformShipmentsToGeoJsonPoints(shipments)})
  }

  displayRoute(route: Route, matchStreets: boolean = true) {
    if (matchStreets) {
      this.updateLayerData$.next({layerId: "polyline", data: route.getGeometryAsGeoJson()})
    } else {
      this.updateLayerData$.next({layerId: "polyline", data: route.getGeometryDirectAsGeoJson()})
    }
  }

  resetPolyline() {
    this.updateLayerData$.next({
      layerId: "polyline", data: {
        type: 'FeatureCollection',
        features: []
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
