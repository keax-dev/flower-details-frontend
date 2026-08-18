import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { CsrfService } from './core/http/csrf.service';
import { AuthService } from './features/auth/application/auth.service';
import { Component, DestroyRef, inject } from '@angular/core';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
