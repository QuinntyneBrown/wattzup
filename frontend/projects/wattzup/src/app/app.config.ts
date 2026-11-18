// Composition root: binds every contract to its implementation.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import {
  apiKeyInterceptor,
  BIKE_API,
  CLASS_API,
  HttpBikeApi,
  HttpClassApi,
  HttpMachineApi,
  HttpWorkoutApi,
  MACHINE_API,
  UNAUTHORIZED_HANDLER,
  WORKOUT_API,
} from '@wattzup/api';
import { ThemeService } from './core/theme.service';
import { redirectToUnlock } from './core/unlock-redirect';
import { IframeYouTubePlayer } from './core/iframe-youtube-player';
import { YOUTUBE_PLAYER } from './core/youtube-player';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAppInitializer(() => void inject(ThemeService)),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiKeyInterceptor])),
    { provide: UNAUTHORIZED_HANDLER, useFactory: redirectToUnlock },
    { provide: BIKE_API, useClass: HttpBikeApi },
    { provide: WORKOUT_API, useClass: HttpWorkoutApi },
    { provide: YOUTUBE_PLAYER, useClass: IframeYouTubePlayer },
    { provide: MACHINE_API, useClass: HttpMachineApi },
    { provide: CLASS_API, useClass: HttpClassApi },
  ],
};
