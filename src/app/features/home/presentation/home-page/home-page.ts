import { Component, computed, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '@features/auth/application/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [NzButtonModule, RouterLink],
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;
  protected readonly greeting = computed(() => this.user()?.names ?? 'bienvenido');
}
