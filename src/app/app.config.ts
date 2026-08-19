import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

import { authSessionInterceptor } from '@features/auth/application/auth-session.interceptor';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { credentialsInterceptor } from '@core/http/interceptors/credentials.interceptor';
import { csrfInterceptor } from '@core/http/interceptors/csrf.interceptor';
import { routes } from '@app/app.routes';

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
