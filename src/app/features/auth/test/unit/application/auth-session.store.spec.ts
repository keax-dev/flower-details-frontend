import { AuthSessionStore } from '@features/auth/application/auth-session.store';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';

const USER: AuthUser = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '0102030405',
  role: 'ADMIN',
};

describe('AuthSessionStore', () => {
  it('starts without an authenticated user', () => {
    const store = new AuthSessionStore();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('exposes the user after setting a session', () => {
    const store = new AuthSessionStore();

    store.setUser(USER);

    expect(store.user()).toEqual(USER);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('clears the user and authentication state', () => {
    const store = new AuthSessionStore();
    store.setUser(USER);

    store.clear();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });
});
