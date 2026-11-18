// HTTP implementations of the API contracts, bound in app.config.ts.
import { HttpClient, HttpContext, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TimeoutError, catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { SKIP_UNLOCK_REDIRECT } from './api-key.interceptor';
import type {
  BikeState,
  ChooseMachineRequest,
  ClassCatalogue,
  ClassEntry,
  EventToken,
  Machine,
  SetInclineRequest,
  SetSpeedRequest,
  RecentPackets,
  PowerTrace,
  WorkoutStarted,
  StartPlan,
  WorkoutSnapshot,
} from './api-types';
import { type BikeApi, COMMAND_TIMEOUT_MS, type KeyCheck, RequestTimeoutError } from './bike-api';
import type { ClassApi } from './class-api';
import type { MachineApi } from './machine-api';
import type { WorkoutApi } from './workout-api';

/** Posts a command and turns a 5 s silence into RequestTimeoutError. */
async function postCommand(http: HttpClient, url: string, body: unknown): Promise<void> {
  await firstValueFrom(
    http.post(url, body).pipe(
      timeout(COMMAND_TIMEOUT_MS),
      catchError((e: unknown) =>
        throwError(() =>
          e instanceof TimeoutError ? new RequestTimeoutError(COMMAND_TIMEOUT_MS) : e,
        ),
      ),
    ),
  );
}

@Injectable()
export class HttpBikeApi implements BikeApi {
  private readonly http = inject(HttpClient);

  status(): Promise<BikeState> {
    return firstValueFrom(this.http.get<BikeState>('/api/status'));
  }

  async eventToken(): Promise<string> {
    const res = await firstValueFrom(this.http.post<EventToken>('/api/events/token', null));
    return res.token;
  }

  setResistance(level: number): Promise<void> {
    return postCommand(this.http, '/api/resistance', { level });
  }

  async diagnosticsPackets(): Promise<string[]> {
    return (await firstValueFrom(this.http.get<RecentPackets>('/api/diagnostics/packets'))).lines;
  }

  async reconnect(): Promise<void> {
    await firstValueFrom(this.http.post('/api/bike/reconnect', null));
  }

  async verifyKey(key: string): Promise<KeyCheck> {
    try {
      await firstValueFrom(
        this.http
          .get('/api/status', {
            headers: new HttpHeaders({ 'X-Api-Key': key }),
            context: new HttpContext().set(SKIP_UNLOCK_REDIRECT, true),
          })
          .pipe(timeout(5000)),
      );
      return 'ok';
    } catch (e) {
      return e instanceof HttpErrorResponse && e.status === 401 ? 'rejected' : 'unreachable';
    }
  }
}

@Injectable()
export class HttpWorkoutApi implements WorkoutApi {
  private readonly http = inject(HttpClient);

  async start(plan: StartPlan): Promise<WorkoutSnapshot> {
    return (await firstValueFrom(this.http.post<WorkoutStarted>('/api/workout', plan))).started;
  }

  async stop(): Promise<void> {
    await firstValueFrom(this.http.post('/api/workout/stop', null));
  }

  async pause(): Promise<void> {
    await firstValueFrom(this.http.post('/api/workout/pause', null));
  }

  async resume(): Promise<void> {
    await firstValueFrom(this.http.post('/api/workout/resume', null));
  }

  async backToPlan(): Promise<void> {
    await firstValueFrom(this.http.post('/api/workout/back-to-plan', null));
  }

  trace(): Promise<PowerTrace> {
    return firstValueFrom(this.http.get<PowerTrace>('/api/workout/trace'));
  }
}

@Injectable()
export class HttpMachineApi implements MachineApi {
  private readonly http = inject(HttpClient);

  async choose(machine: Machine): Promise<void> {
    const body: ChooseMachineRequest = { machine };
    await firstValueFrom(this.http.post('/api/machine', body));
  }

  setSpeed(speed: number): Promise<void> {
    const body: SetSpeedRequest = { speed };
    return postCommand(this.http, '/api/speed', body);
  }

  setIncline(incline: number): Promise<void> {
    const body: SetInclineRequest = { incline };
    return postCommand(this.http, '/api/incline', body);
  }
}

@Injectable()
export class HttpClassApi implements ClassApi {
  private readonly http = inject(HttpClient);

  list(): Promise<ClassCatalogue> {
    return firstValueFrom(this.http.get<ClassCatalogue>('/api/classes'));
  }

  async get(id: string): Promise<ClassEntry | 'not-found'> {
    try {
      return await firstValueFrom(
        this.http.get<ClassEntry>(`/api/classes/${encodeURIComponent(id)}`),
      );
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 404) return 'not-found';
      throw e;
    }
  }
}
