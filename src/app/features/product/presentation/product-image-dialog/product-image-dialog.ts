import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadFile, NzUploadModule, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { Subscription } from 'rxjs';

import { Product } from '@features/product/models/product.model';
import { ProductApiService } from '@features/product/services/product-api.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

@Component({
  selector: 'app-product-image-dialog',
  imports: [FontAwesomeModule, NzModalModule, NzUploadModule],
  templateUrl: './product-image-dialog.html',
  styleUrl: './product-image-dialog.css',
})
export class ProductImageDialog {
  private readonly productApiService = inject(ProductApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly product = input.required<Product>();
  readonly isOpen = input(false);

  readonly closed = output<void>();
  readonly uploaded = output<Product>();

  protected readonly acceptedImageTypes = ACCEPTED_IMAGE_TYPES;
  protected readonly faUpload = faUpload;
  protected readonly isUploading = signal(false);
  protected fileList: NzUploadFile[] = [];

  protected readonly uploadImage = (item: NzUploadXHRArgs) => {
    const image = item.file.originFileObj;
    if (image === undefined) {
      item.onError?.(new Error('No se pudo obtener el archivo seleccionado.'), item.file);
      return new Subscription();
    }

    this.isUploading.set(true);
    return this.productApiService
      .uploadImages(this.product().id, [image])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          item.onSuccess?.(product, item.file, null);
          this.uploaded.emit(product);
          this.notificationService.success('Imagen cargada correctamente.');
          this.isUploading.set(false);
        },
        error: (error: unknown) => {
          item.onError?.(error, item.file);
          this.notificationService.error(resolveApiErrorMessage(error, 'No fue posible cargar la imagen.'));
          this.isUploading.set(false);
        },
      });
  };
}
