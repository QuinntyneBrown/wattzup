import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RideRecordedDto, RidesApi, SubmitRideRequest } from './rides-api';

/** The finished rides' HTTP client: `POST /api/rides`. */
@Injectable()
export class HttpRidesApi implements RidesApi {
  private readonly http = inject(HttpClient);

  submitRide(ride: SubmitRideRequest): Observable<RideRecordedDto> {
    return this.http.post<RideRecordedDto>('/api/rides', ride);
  }
}
