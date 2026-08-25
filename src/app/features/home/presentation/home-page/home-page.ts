import { Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '@features/auth/application/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [NzButtonModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;
}
