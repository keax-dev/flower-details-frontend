import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faDownload,
  faFloppyDisk,
  faImage,
  faPenToSquare,
  faTrash,
  faUpload,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzBeforeUploadFileType, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

import { Product } from '@features/product/models/product.model';
import { ProductImage } from '@features/product/models/product-image.model';
import { ProductImagePosition } from '@features/product/models/product-image-position.model';
import { ProductApiService } from '@features/product/services/product-api.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

@Component({
  selector: 'app-product-image-dialog',
  imports: [FontAwesomeModule, NzModalModule, NzPopconfirmModule, NzUploadModule],
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
  protected readonly faArrowDown = faArrowDown;
  protected readonly faArrowUp = faArrowUp;
  protected readonly faDownload = faDownload;
  protected readonly faFloppyDisk = faFloppyDisk;
  protected readonly faImage = faImage;
  protected readonly faPenToSquare = faPenToSquare;
  protected readonly faTrash = faTrash;
  protected readonly faUpload = faUpload;
  protected readonly faXmark = faXmark;
  protected readonly isUploading = signal(false);
  protected readonly isChangingPositions = signal(false);
  protected readonly isSavingPositions = signal(false);
  protected readonly deletingImageId = signal<number | null>(null);
  protected readonly managedImages = signal<ProductImage[]>([]);
  protected readonly positionValues = signal<Record<number, number>>({});
  protected readonly positionError = signal<string | null>(null);
  protected fileList: NzUploadFile[] = [];

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetManagedImages(this.product().images);
      }
    });
  }

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
          this.applyProduct(product);
          this.notificationService.success('Imagenes guardadas correctamente.');
          this.isUploading.set(false);
        },
        error: (error: unknown) => {
          this.notificationService.error(resolveApiErrorMessage(error, 'No fue posible guardar las imagenes.'));
          this.isUploading.set(false);
        },
      });
  }

  protected startChangingPositions(): void {
    this.positionError.set(null);
    this.positionValues.set(this.positionsFor(this.managedImages()));
    this.isChangingPositions.set(true);
  }

  protected cancelChangingPositions(): void {
    this.positionError.set(null);
    this.positionValues.set(this.positionsFor(this.managedImages()));
    this.isChangingPositions.set(false);
  }

  protected updatePosition(imageId: number, value: string): void {
    this.positionValues.update((positions) => ({ ...positions, [imageId]: Number(value) }));
    this.positionError.set(null);
  }

  protected moveImage(imageId: number, direction: -1 | 1): void {
    const images = this.managedImages();
    const sourceIndex = images.findIndex((image) => image.id === imageId);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reorderedImages = [...images];
    [reorderedImages[sourceIndex], reorderedImages[targetIndex]] = [
      reorderedImages[targetIndex],
      reorderedImages[sourceIndex],
    ];
    this.managedImages.set(reorderedImages);
    this.positionValues.set(this.positionsFor(reorderedImages));
  }

  protected savePositions(): void {
    const positions = this.toPositions();
    if (positions === null) {
      return;
    }

    this.isSavingPositions.set(true);
    this.productApiService
      .updateImagePositions(this.product().id, positions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.applyProduct(product);
          this.isChangingPositions.set(false);
          this.isSavingPositions.set(false);
          this.notificationService.success('Posiciones actualizadas correctamente.');
        },
        error: (error: unknown) => {
          this.isSavingPositions.set(false);
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible actualizar las posiciones.'),
          );
        },
      });
  }

  protected deleteImage(image: ProductImage): void {
    this.deletingImageId.set(image.id);
    this.productApiService
      .deleteImage(this.product().id, image.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.applyProduct(product);
          this.deletingImageId.set(null);
          this.notificationService.success('Imagen eliminada correctamente.');
        },
        error: (error: unknown) => {
          this.deletingImageId.set(null);
          this.notificationService.error(resolveApiErrorMessage(error, 'No fue posible eliminar la imagen.'));
        },
      });
  }

  protected positionFor(image: ProductImage): number {
    return this.positionValues()[image.id] ?? image.sortOrder + 1;
  }

  protected isFirstImage(image: ProductImage): boolean {
    return this.managedImages().at(0)?.id === image.id;
  }

  protected isLastImage(image: ProductImage): boolean {
    return this.managedImages().at(-1)?.id === image.id;
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

  private applyProduct(product: Product): void {
    this.resetManagedImages(product.images);
    this.uploaded.emit(product);
  }

  private resetManagedImages(images: readonly ProductImage[]): void {
    const sortedImages = [...images].sort((first, second) => first.sortOrder - second.sortOrder);
    this.managedImages.set(sortedImages);
    this.positionValues.set(this.positionsFor(sortedImages));
    this.positionError.set(null);
  }

  private positionsFor(images: readonly ProductImage[]): Record<number, number> {
    return Object.fromEntries(images.map((image, index) => [image.id, index + 1]));
  }

  private toPositions(): ProductImagePosition[] | null {
    const images = this.managedImages();
    const enteredPositions = images.map((image) => this.positionFor(image));
    const expectedPositions = Array.from({ length: images.length }, (_, index) => index + 1);
    const validPositions =
      enteredPositions.every(Number.isInteger) &&
      new Set(enteredPositions).size === images.length &&
      expectedPositions.every((position) => enteredPositions.includes(position));

    if (!validPositions) {
      this.positionError.set('Las posiciones deben ser únicas y consecutivas, desde 1 hasta el total de imágenes.');
      return null;
    }

    this.positionError.set(null);
    return images.map((image) => ({ imageId: image.id, sortOrder: this.positionFor(image) - 1 }));
  }
}
