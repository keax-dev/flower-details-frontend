import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { CatalogApiService } from '@features/catalog/services/catalog-api.service';
import { Product } from '@features/product/models/product.model';

@Component({
  selector: 'app-catalog-detail-page',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink],
  templateUrl: './catalog-detail-page.html',
  styleUrl: './catalog-detail-page.css',
})
export class CatalogDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private productSubscription?: Subscription;
  private productId: number | null = null;

  protected readonly product = signal<Product | null>(null);
  protected readonly selectedImageIndex = signal(0);
  protected readonly selectedImage = computed(() => this.product()?.images[this.selectedImageIndex()] ?? null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly canRetry = signal(false);

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

  private loadProduct(): void {
    this.productSubscription?.unsubscribe();
    this.product.set(null);
    this.selectedImageIndex.set(0);
    this.errorMessage.set(null);
    this.canRetry.set(false);

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
