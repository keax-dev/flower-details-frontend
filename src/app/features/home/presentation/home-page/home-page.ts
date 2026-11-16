import { Component, inject } from '@angular/core';
import { AuthService } from '@features/auth/application/auth.service';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBagShopping, faRightToBracket, faUserPlus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home-page',
  imports: [FontAwesomeModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  protected readonly faBagShopping = faBagShopping;
  protected readonly faRightToBracket = faRightToBracket;
  protected readonly faUserPlus = faUserPlus;
  protected readonly faWandMagicSparkles = faWandMagicSparkles;
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;
}
