import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload, faFloppyDisk, faImage, faTrash, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzBeforeUploadFileType, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

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
  protected readonly faDownload = faDownload;
  protected readonly faFloppyDisk = faFloppyDisk;
  protected readonly faImage = faImage;
  protected readonly faTrash = faTrash;
  protected readonly faUpload = faUpload;
  protected readonly faXmark = faXmark;
  protected readonly isUploading = signal(false);
  protected fileList: NzUploadFile[] = [];

  protected readonly queueImage = (file: NzUploadFile): NzBeforeUploadFileType => {
    this.fileList = [...this.fileList, this.toQueuedFile(file)];
    return false;
  };

  protected readonly removeQueuedImage = (file: NzUploadFile): boolean => {
    this.fileList = this.fileList.filter((queuedFile) => queuedFile.uid !== file.uid);
    return true;
  };

  protected readonly downloadImage = (file: NzUploadFile): void => {
    const image = file.originFileObj;
    if (!(image instanceof File)) {
      return;
    }

    const downloadUrl = URL.createObjectURL(image);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = image.name;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  protected saveImages(): void {
    const images = this.fileList
      .map((file) => file.originFileObj)
      .filter((file): file is File => file instanceof File);

    if (images.length === 0) {
      this.notificationService.warning('Selecciona al menos una imagen para guardar.');
      return;
    }

    this.isUploading.set(true);
    this.productApiService
      .uploadImages(this.product().id, images)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.fileList = [];
          this.uploaded.emit(product);
          this.notificationService.success('Imagenes guardadas correctamente.');
          this.isUploading.set(false);
        },
        error: (error: unknown) => {
          this.notificationService.error(resolveApiErrorMessage(error, 'No fue posible guardar las imagenes.'));
          this.isUploading.set(false);
        },
      });
  }

  private toQueuedFile(file: NzUploadFile): NzUploadFile {
    return {
      uid: file.uid,
      name: file.name,
      size: file.size,
      type: file.type,
      originFileObj: file as unknown as File,
      status: 'done',
    };
  }
}
