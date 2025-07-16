import {Injectable} from '@angular/core';
import {Vehicle} from '../models/Vehicle';
import {Shipment} from '../models/Shipment';
import {ScenarioOptions} from '../models/ScenarioOptions';
import {VroomDto} from '../models/VroomDto';
import {VroomShipmentDto} from '../models/VroomShipmentDto';
import * as _ from 'lodash';
import {VroomVehicleDto} from '../models/VroomVehicleDto';
import {map, Observable} from 'rxjs';
import {Route} from '../models/Route';
import {HttpClient} from '@angular/common/http';
import {ConfigService} from '../config/config.service';

@Injectable({
  providedIn: 'root'
})
export class VroomService {
  private readonly VROOM_URL
  private readonly DEFAULT_MAX_CAPACITY = 4

  constructor(protected httpClient: HttpClient, configService: ConfigService) {
    this.VROOM_URL = configService.getVroomUrl()
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

  calculateRoute(requestBody: VroomDto): Observable<Route[]> {
    return this.httpClient.post(this.VROOM_URL, requestBody).pipe(
      map(this.transformResponseToRoute)
    )

  }

  protected transformResponseToRoute(vroomResponse: any): Route[] {
    return vroomResponse.routes.map((vroomRoute: any) => new Route(vroomRoute))
  }
}
