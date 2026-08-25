import { TestBed } from '@angular/core/testing';
import { AuthService } from '@features/auth/application/auth.service';
import { CsrfService } from '@core/http/security/csrf.service';
import { EMPTY, of, throwError } from 'rxjs';

import { App } from '../../app';

describe('App bootstrap', () => {
  it('initializes CSRF protection before restoring the session', async () => {
    const csrfService = { initialize: vi.fn(() => of(undefined)) };
    const authService = { restoreSession: vi.fn(() => EMPTY) };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: CsrfService, useValue: csrfService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    TestBed.createComponent(App);

    expect(csrfService.initialize).toHaveBeenCalledOnce();
    expect(authService.restoreSession).toHaveBeenCalledOnce();
  });

  it('keeps the public shell available when initialization fails', async () => {
    const csrfService = { initialize: vi.fn(() => throwError(() => new Error('Offline'))) };
    const authService = { restoreSession: vi.fn(() => EMPTY) };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: CsrfService, useValue: csrfService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
    expect(authService.restoreSession).not.toHaveBeenCalled();
  });
});
