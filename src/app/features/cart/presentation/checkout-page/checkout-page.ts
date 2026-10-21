import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { AuthService } from '@features/auth/application/auth.service';
import { Cart } from '@features/cart/models/cart.model';
import { CartApiService } from '@features/cart/services/cart-api.service';
import { CreateOrderRequest } from '@features/order/models/create-order-request.model';
import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { OrderApiService } from '@features/order/services/order-api.service';

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { blank: true };
}

function deliveryAddressRequired(control: AbstractControl): ValidationErrors | null {
  const type: unknown = control.get('fulfillmentType')?.value;
  const address: unknown = control.get('deliveryAddress')?.value;
  return type === 'DELIVERY' && typeof address === 'string' && !address.trim() ? { deliveryAddressRequired: true } : null;
}

@Component({
  selector: 'app-checkout-page',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.css',
})
export class CheckoutPage {
  private readonly authService = inject(AuthService);
  private readonly cartApi = inject(CartApiService);
  private readonly orderApi = inject(OrderApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly formElement = viewChild<ElementRef<HTMLFormElement>>('checkoutFormElement');
  private readonly user = this.authService.user();

  protected readonly cart = signal<Cart | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | string[] | null>(null);
  protected readonly errorMessages = computed(() => {
    const message = this.errorMessage();
    return message === null ? [] : Array.isArray(message) ? message : [message];
  });
  protected readonly hasUnavailable = computed(() => this.cart()?.items.some((item) => !item.product.available) ?? false);
  protected readonly checkoutForm = this.formBuilder.group(
    {
      fulfillmentType: ['PICKUP' as FulfillmentType, [Validators.required]],
      contactName: [this.user ? `${this.user.names} ${this.user.lastNames}`.trim() : '', [Validators.required, Validators.maxLength(160), notBlank]],
      contactPhone: [this.user?.phone ?? '', [Validators.required, Validators.maxLength(30), notBlank]],
      deliveryAddress: ['', [Validators.maxLength(500)]],
      additionalInstructions: ['', [Validators.maxLength(1000)]],
    },
    { validators: deliveryAddressRequired },
  );
  protected readonly fulfillmentType = toSignal(this.checkoutForm.controls.fulfillmentType.valueChanges, {
    initialValue: this.checkoutForm.controls.fulfillmentType.value,
  });

  constructor() {
    this.loadCart();
  }

  protected retry(): void {
    this.loadCart();
  }

  protected hasError(name: 'contactName' | 'contactPhone' | 'deliveryAddress' | 'additionalInstructions'): boolean {
    const control = this.checkoutForm.controls[name];
    return control.invalid && control.touched;
  }

  protected addressRequiredError(): boolean {
    return this.checkoutForm.hasError('deliveryAddressRequired') && this.checkoutForm.controls.deliveryAddress.touched;
  }

  protected submit(): void {
    if (this.isSubmitting() || !this.cart()?.items.length || this.hasUnavailable()) return;
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      const invalidField = this.formElement()?.nativeElement.querySelector<HTMLElement>('[formControlName].ng-invalid');
      (invalidField ?? this.formElement()?.nativeElement.querySelector<HTMLElement>('#checkout-delivery-address'))?.focus();
      return;
    }

    const value = this.checkoutForm.getRawValue();
    const request: CreateOrderRequest = {
      fulfillmentType: value.fulfillmentType,
      contactName: value.contactName.trim(),
      contactPhone: value.contactPhone.trim(),
      deliveryAddress: value.fulfillmentType === 'DELIVERY' ? value.deliveryAddress.trim() : null,
      additionalInstructions: value.additionalInstructions.trim() || null,
    };
    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.orderApi
      .create(request)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => void this.router.navigate(['/cart/confirmation', order.id]),
        error: (error: unknown) => this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible confirmar el pedido. Inténtalo nuevamente.')),
      });
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
}
