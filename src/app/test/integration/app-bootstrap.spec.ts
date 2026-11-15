import { TestBed } from '@angular/core/testing';
import { AuthService } from '@features/auth/application/auth.service';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

import { App } from '../../app';

describe('App bootstrap', () => {
  it('restores the session when the application starts', async () => {
    const authService = { restoreSession: vi.fn(() => of(null)) };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    TestBed.createComponent(App);

    expect(authService.restoreSession).toHaveBeenCalledOnce();
  });

  it('keeps the public shell available when session restoration fails', async () => {
    const authService = { restoreSession: vi.fn(() => throwError(() => new Error('Offline'))) };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
    expect(authService.restoreSession).toHaveBeenCalledOnce();
  });
});
