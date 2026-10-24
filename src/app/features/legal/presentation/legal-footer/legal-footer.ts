import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal-footer',
  imports: [RouterLink],
  template: `
    <footer class="legal-footer">
      <div class="container-fluid legal-footer__content">
        <span>© Flower Details · ALX GARDEN</span>
        <nav aria-label="Información legal" class="legal-footer__links">
          <a routerLink="/legal/terms">Términos y condiciones</a>
          <a routerLink="/legal/privacy">Política de privacidad</a>
          <a href="mailto:alexgarden@gmail.com">Contacto</a>
        </nav>
      </div>
    </footer>
  `,
  styleUrl: './legal-footer.css',
})
export class LegalFooter {}
