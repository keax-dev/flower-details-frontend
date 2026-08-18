import { AuthService } from '../../../auth/application/auth.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { RouterLink } from '@angular/router';
import { Component, computed, inject } from '@angular/core';

@Component({
  selector: 'app-home-page',
  imports: [HlmButtonImports, RouterLink],
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;
  protected readonly greeting = computed(() => this.user()?.names ?? 'bienvenido');
}
