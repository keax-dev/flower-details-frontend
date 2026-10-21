import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { Cart, CartItem } from '@features/cart/models/cart.model';
import { CartApiService } from '@features/cart/services/cart-api.service';
import { finalize, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-cart-page',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
})
export class CartPage {
  private readonly cartApi = inject(CartApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('cartTitle');

  protected readonly cart = signal<Cart | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isMutating = signal(false);
  protected readonly busyItemId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | string[] | null>(null);
  protected readonly errorMessages = computed(() => {
    const message = this.errorMessage();
    return message === null ? [] : Array.isArray(message) ? message : [message];
  });
  protected readonly itemCount = computed(() => this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0);

  constructor() {
    this.loadCart();
  }

  protected retry(): void {
    this.loadCart();
  }

  protected updateQuantity(item: CartItem, input: HTMLInputElement): void {
    if (this.isMutating()) return;
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      this.errorMessage.set('La cantidad debe ser un número entero entre 1 y 100.');
      input.focus();
      return;
    }
    if (quantity === item.quantity) return;
    this.mutate(this.cartApi.updateQuantity(item.id, quantity), item.id);
  }

  protected remove(itemId: number): void {
    if (this.isMutating()) return;
    this.mutate(this.cartApi.remove(itemId).pipe(switchMap(() => this.cartApi.get())), itemId, true);
  }

  protected clear(): void {
    if (this.isMutating() || !this.cart()?.items.length) return;
    this.mutate(this.cartApi.clear().pipe(switchMap(() => this.cartApi.get())), null, true);
  }

  private loadCart(): void {
    this.cart.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(true);
    this.cartApi
      .get()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (cart) => this.cart.set(cart),
        error: (error: unknown) => this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible cargar el carrito. Inténtalo nuevamente.')),
      });
  }

  private mutate(request: Observable<Cart>, itemId: number | null = null, focusHeading = false): void {
    this.errorMessage.set(null);
    this.isMutating.set(true);
    this.busyItemId.set(itemId);
    request
      .pipe(
        finalize(() => {
          this.isMutating.set(false);
          this.busyItemId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          if (focusHeading) this.heading().nativeElement.focus();
        },
        error: (error: unknown) =>
          this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible actualizar el carrito. Inténtalo nuevamente.')),
      });
  }
}
