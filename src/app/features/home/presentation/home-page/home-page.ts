import { Component, inject } from '@angular/core';
import { AuthService } from '@features/auth/application/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;
}
