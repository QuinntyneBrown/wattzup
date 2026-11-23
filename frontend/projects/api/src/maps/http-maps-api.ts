import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { MapDto } from './map-dto';
import type { MapsApi } from './maps-api';

/** The map catalogue's HTTP client: `GET /api/maps` (ADR 0029). */
@Injectable()
export class HttpMapsApi implements MapsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<readonly MapDto[]> {
    return this.http.get<readonly MapDto[]>('/api/maps');
  }
}
