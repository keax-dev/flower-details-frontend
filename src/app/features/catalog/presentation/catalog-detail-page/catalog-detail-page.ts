import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { AuthService } from '@features/auth/application/auth.service';
import { CartApiService } from '@features/cart/services/cart-api.service';
import { CatalogApiService } from '@features/catalog/services/catalog-api.service';
import { Product } from '@features/product/models/product.model';

@Component({
  selector: 'app-catalog-detail-page',
  imports: [CurrencyPipe, NgOptimizedImage, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog-detail-page.html',
  styleUrl: './catalog-detail-page.css',
})
export class CatalogDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cartApi = inject(CartApiService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private productSubscription?: Subscription;
  private productId: number | null = null;

  protected readonly product = signal<Product | null>(null);
  protected readonly selectedImageIndex = signal(0);
  protected readonly selectedImage = computed(() => this.product()?.images[this.selectedImageIndex()] ?? null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly canRetry = signal(false);
  protected readonly user = this.authService.user;
  protected readonly quantity = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1), Validators.max(100), Validators.pattern(/^\d+$/)],
  });
  protected readonly isAdding = signal(false);
  protected readonly addSuccess = signal(false);
  protected readonly addError = signal<string | string[] | null>(null);
  protected readonly addErrorMessages = computed(() => {
    const message = this.addError();
    return message === null ? [] : Array.isArray(message) ? message : [message];
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const rawId = params.get('id');
      const id = Number(rawId);
      this.productId = rawId !== null && Number.isSafeInteger(id) && id > 0 ? id : null;
      this.loadProduct();
    });
  }

  protected selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  protected retry(): void {
    this.loadProduct();
  }

  protected addToCart(): void {
    const product = this.product();
    if (product === null || this.user()?.role !== 'CUSTOMER' || this.isAdding()) return;
    if (this.quantity.invalid) {
      this.quantity.markAsTouched();
      return;
    }

    this.addError.set(null);
    this.addSuccess.set(false);
    this.isAdding.set(true);
    this.cartApi
      .add(product.id, this.quantity.value)
      .pipe(
        finalize(() => this.isAdding.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.addSuccess.set(true),
        error: (error: unknown) => this.addError.set(resolveApiErrorMessage(error, 'No fue posible agregar el producto al carrito.')),
      });
  }

  private loadProduct(): void {
    this.productSubscription?.unsubscribe();
    this.product.set(null);
    this.selectedImageIndex.set(0);
    this.errorMessage.set(null);
    this.canRetry.set(false);
    this.addSuccess.set(false);
    this.addError.set(null);
    this.quantity.reset(1);

    if (this.productId === null) {
      this.isLoading.set(false);
      this.errorMessage.set('Este producto no está disponible.');
      return;
    }

    this.isLoading.set(true);
    this.productSubscription = this.catalogApi
      .getById(this.productId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (product) => this.product.set(product),
        error: () => {
          this.errorMessage.set('No fue posible cargar este producto. Inténtalo nuevamente.');
          this.canRetry.set(true);
        },
      });
  }
}
