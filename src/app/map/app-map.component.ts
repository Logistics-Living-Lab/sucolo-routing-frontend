import {Component, EventEmitter, NgZone, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {FeatureCollection, GeoJSON, LineString, Point, Polygon} from 'geojson';
import {concatMap, from, Observable, of} from 'rxjs';
import {Anchor, Expression, Map, MapboxEvent, MapMouseEvent} from 'mapbox-gl';
import {AppMapService} from './app-map.service';
import {FormsModule} from '@angular/forms';
import {GeoJSONSourceComponent, LayerComponent, MapComponent} from 'ngx-mapbox-gl';
import {OidcSecurityService} from 'angular-auth-oidc-client';

@Component({
  selector: 'app-map',
  imports: [
    FormsModule,
    MapComponent,
    GeoJSONSourceComponent,
    LayerComponent
  ],
  templateUrl: './app-map.component.html',
  styleUrl: './app-map.component.css'
})
export class AppMapComponent implements OnInit, OnDestroy {
  title = 'sucolo-routing-frontend';

  @ViewChild(AppMapComponent) mapComponent!: AppMapComponent;
  @Output() mapReady = new EventEmitter<Map>

  map!: Map

  constructor(protected mapService: AppMapService, protected zone: NgZone, protected oidcSecurityService: OidcSecurityService) {
  }

  ngOnInit(): void {
    this.mapService.setMapLocation.subscribe(
      (location: any) => this.onNewMapLocationReceived(location)
    )
    this.mapService.updateLayerData$.subscribe((event) => this.onUpdateLayerData(event.layerId, event.data))
  }

  ngOnDestroy(): void {
    this.mapService.setMapLocation.unsubscribe()
    this.mapService.updateLayerData$.unsubscribe()
  }

  polylineData: GeoJSON.FeatureCollection<LineString> | undefined = {
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
        'start', '#98FF98',
        'end', '#FF7F50',
        'pickup', '#FE53BB',
        'delivery', '#FCFF03',
        'job', '#FCFF03',
        '#000000'
      ] as Expression,
      // 'text-color': '#00FFFF',
      'text-color': '#ffffff',
      // 'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1.0,
    },
    layout: {
      'icon-image': 'triangle',
      // 'icon-image': [
      //   // 'match',
      //   // ['get', 'type'],
      //   // 'start', 'bicycle',
      //   'triangle'
      // ] as Expression,
      'icon-size': 0.8,
      'icon-rotate': [
        'match',
        ['get', 'type'],
        'delivery', 90,
        'job', 90,
        'pickup', -90,
        -90
      ] as Expression,
      'text-field': ['get', 'description'] as Expression,
      'text-size': 16,
      'text-font': ['Open Sans Bold'],
      'text-offset': [0, 2],
      'icon-ignore-placement': true,
      'text-anchor': 'top' as Anchor,
      'text-ignore-placement': true,
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
      'text-max-width': 100
    }
  }

  buildingGeojson!: GeoJSON.FeatureCollection<Polygon>

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
    this.buildingGeojson = this.mapService.getBuildings()
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
        },
        error: (err) => {
          console.error('Error loading icons', err);
        },
        complete: () => {
          console.log('All icons loaded');
          console.log("Map is ready")
          this.mapReady.emit(this.map)
        }
      })
  }

  loadIcon(iconName: string) {
    return new Observable<void>((observer) => {
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

  private onNewMapLocationReceived(coordinates: any) {
    this.map.flyTo({
      center: coordinates as [number, number],
      zoom: 18
    })
  }

  private onUpdateLayerData(layerId: string, data: FeatureCollection<Point | LineString>) {
    switch (layerId) {
      case "points":
        this.polylinePoints = data as FeatureCollection<Point>
        break
      case "polyline": {
        this.polylineData = data as FeatureCollection<LineString>
        break
      }
    }
  }

}
