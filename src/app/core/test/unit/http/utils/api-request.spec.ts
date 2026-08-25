import { isApiEndpoint, isApiRequest } from '@core/http/utils/api-request';

describe('API request utilities', () => {
  describe('isApiRequest', () => {
    it('accepts the API base URL and its nested resources', () => {
      expect(isApiRequest('/api', '/api')).toBe(true);
      expect(isApiRequest('/api/categories', '/api')).toBe(true);
      expect(isApiRequest('/api/categories', '/api/')).toBe(true);
    });

    it('rejects URLs that only share the API prefix', () => {
      expect(isApiRequest('/api-v2/categories', '/api')).toBe(false);
      expect(isApiRequest('https://cdn.example.com/image.png', '/api')).toBe(false);
    });
  });

  describe('isApiEndpoint', () => {
    it('matches an endpoint while ignoring its query string', () => {
      expect(isApiEndpoint('/api/auth/csrf?refresh=true', '/api', '/auth/csrf')).toBe(true);
    });

    it('requires the complete endpoint path', () => {
      expect(isApiEndpoint('/api/auth/csrf-token', '/api', '/auth/csrf')).toBe(false);
    });
  });
});
