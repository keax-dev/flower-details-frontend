import { isApiEndpoint, isApiRequest } from '@core/http/utils/api-request';

describe('API request utilities', () => {
  describe('isApiRequest', () => {
    it('resolves paths before attaching credentials or CSRF headers', () => {
      for (const url of ['/api/../other', '/api/%2e%2e/other', '/api\\..\\other', '//attacker.example/api', '/api/%2fother']) {
        expect(isApiRequest(url, '/api')).toBe(false);
      }
      expect(isApiRequest('/api?size=10', '/api')).toBe(true);
      expect(isApiRequest('https://api.example/api/products', 'https://api.example/api')).toBe(true);
      expect(isApiRequest('https://api.example.attacker.test/api/products', 'https://api.example/api')).toBe(false);
      expect(isApiRequest('https://api.example@attacker.test/api/products', 'https://api.example/api')).toBe(false);
    });
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
