import { TestBed } from '@angular/core/testing';
import { Product } from '@features/product/models/product.model';
import { ProductImageDialog } from '@features/product/presentation/product-image-dialog/product-image-dialog';
import { ProductApiService } from '@features/product/services/product-api.service';
import { NotificationService } from '@core/notification/notification.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { of } from 'rxjs';

const PRODUCT: Product = {
  id: 1,
  category: { id: 2, title: 'Ramos' },
  title: 'Ramo de rosas',
  description: 'Docena de rosas rojas',
  price: 25,
  active: true,
  images: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

async function createComponent() {
  const productApiService = {
    deleteImage: vi.fn(() => of(PRODUCT)),
    updateImagePositions: vi.fn(() => of(PRODUCT)),
    uploadImages: vi.fn(() => of(PRODUCT)),
  };
  const notificationService = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  };

  await TestBed.configureTestingModule({
    imports: [ProductImageDialog],
    providers: [
      { provide: ProductApiService, useValue: productApiService },
      { provide: NotificationService, useValue: notificationService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductImageDialog);
  fixture.componentRef.setInput('product', PRODUCT);
  return { fixture, notificationService, productApiService };
}

function selectedImage(): NzUploadFile {
  return Object.assign(new File(['image'], 'roses.png', { type: 'image/png' }), {
    uid: 'image-1',
  }) as unknown as NzUploadFile;
}

describe('ProductImageDialog', () => {
  it('queues a selected image without sending it to the API', async () => {
    const { fixture, productApiService } = await createComponent();

    fixture.componentInstance['queueImage'](selectedImage());

    expect(fixture.componentInstance['fileList']).toHaveLength(1);
    expect(productApiService.uploadImages).not.toHaveBeenCalled();
  });

  it('sends every queued image when the user saves', async () => {
    const { fixture, notificationService, productApiService } = await createComponent();
    const image = selectedImage();

    fixture.componentInstance['queueImage'](image);
    fixture.componentInstance['saveImages']();

    expect(productApiService.uploadImages).toHaveBeenCalledWith(PRODUCT.id, [image]);
    expect(fixture.componentInstance['fileList']).toEqual([]);
    expect(notificationService.success).toHaveBeenCalledWith('Imagenes guardadas correctamente.');
  });

  it('validates positions before saving the new image order', async () => {
    const { fixture, notificationService, productApiService } = await createComponent();
    fixture.componentRef.setInput('product', {
      ...PRODUCT,
      images: [
        { id: 4, url: '/first.png', originalFileName: 'first.png', contentType: 'image/png', sizeBytes: 1, sortOrder: 0 },
        { id: 5, url: '/second.png', originalFileName: 'second.png', contentType: 'image/png', sizeBytes: 1, sortOrder: 1 },
      ],
    });
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    fixture.componentInstance['startChangingPositions']();
    fixture.componentInstance['updatePosition'](4, '1');
    fixture.componentInstance['updatePosition'](5, '1');
    fixture.componentInstance['savePositions']();

    expect(productApiService.updateImagePositions).not.toHaveBeenCalled();
    expect(notificationService.warning).not.toHaveBeenCalled();
    expect(fixture.componentInstance['positionError']()).not.toBeNull();
  });
});
