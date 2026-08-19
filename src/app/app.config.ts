import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

import { credentialsInterceptor } from './core/http/credentials.interceptor';
import { csrfInterceptor } from './core/http/csrf.interceptor';
import { authSessionInterceptor } from './features/auth/application/auth-session.interceptor';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideSpartanHlm(),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, csrfInterceptor, authSessionInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideRouter(routes),
  ],
};
