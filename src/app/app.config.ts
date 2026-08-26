import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { credentialsInterceptor } from '@core/http/interceptors/credentials.interceptor';
import { authSessionInterceptor } from '@features/auth/application/auth-session.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { csrfInterceptor } from '@core/http/interceptors/csrf.interceptor';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideRouter } from '@angular/router';
import { routes } from '@app/app.routes';
import { provideQuillConfig } from 'ngx-quill/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideNzI18n(es_ES),
    provideQuillConfig({ format: 'html', sanitize: true, theme: 'snow' }),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, csrfInterceptor, authSessionInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideRouter(routes),
  ],
};
