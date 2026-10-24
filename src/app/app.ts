import { Component, DestroyRef, inject } from '@angular/core';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { ApplicationNavigation } from '@layout/application-navigation/application-navigation';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@features/auth/application/auth.service';
import { CsrfService } from '@core/http/security/csrf.service';
import { LegalFooter } from '@features/legal/presentation/legal-footer/legal-footer';

@Component({
  selector: 'app-root',
  imports: [ApplicationNavigation, LegalFooter, RouterOutlet],
  template: `
    <app-application-navigation />
    <router-outlet />
    <app-legal-footer />
  `,
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
