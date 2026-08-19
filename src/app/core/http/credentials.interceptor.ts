import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from './api.config';
import { isApiRequest } from './api-request';

export const credentialsInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url, inject(API_BASE_URL))) {
    return next(request);
  }

  return next(request.clone({ withCredentials: true }));
};
