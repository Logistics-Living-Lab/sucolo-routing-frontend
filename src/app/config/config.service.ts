import {Inject, Injectable} from '@angular/core';
import {AppConfig} from './config.interface';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  protected config!: AppConfig

  constructor(protected httpClient: HttpClient,
              @Inject("APP_CONFIG") appConfig: AppConfig
  ) {
    this.config = appConfig
  }

  getVroomUrl() {
    return this.config.vroomUrl
  }

  getMapboxToken() {
    return this.config.mapboxToken
  }

  getCommitHash() {
    return this.config.commitHash
  }
}
