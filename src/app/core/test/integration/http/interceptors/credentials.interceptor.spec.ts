import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { credentialsInterceptor } from '@core/http/interceptors/credentials.interceptor';

describe('credentialsInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('sends browser credentials to API requests', () => {
    httpClient.get('/api/categories').subscribe();

    const request = httpTestingController.expectOne('/api/categories');
    expect(request.request.withCredentials).toBe(true);
    request.flush({});
  });

  it('does not alter requests to external resources', () => {
    const imageUrl = 'https://cdn.example.com/products/rose.png';
    httpClient.get(imageUrl).subscribe();

    const request = httpTestingController.expectOne(imageUrl);
    expect(request.request.withCredentials).toBe(false);
    request.flush({});
  });
});
