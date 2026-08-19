import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '@features/auth/application/auth.service';
import { ApplicationNavigation } from '@layout/application-navigation/application-navigation';
import { CsrfService } from '@core/http/security/csrf.service';
import { Component, DestroyRef, inject } from '@angular/core';
import { catchError, EMPTY, switchMap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [ApplicationNavigation, RouterOutlet],
  template: '<app-application-navigation /><router-outlet />',
})
export class App {
  private readonly csrfService = inject(CsrfService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.csrfService
      .initialize()
      .pipe(
        switchMap(() => this.authService.restoreSession()),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
