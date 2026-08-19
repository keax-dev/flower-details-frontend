export function isApiRequest(url: string, apiBaseUrl: string): boolean {
  const normalizedBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  return url === normalizedBaseUrl || url.startsWith(`${normalizedBaseUrl}/`);
}

export function isApiEndpoint(url: string, apiBaseUrl: string, path: string): boolean {
  const normalizedBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  return url.split('?')[0] === `${normalizedBaseUrl}${path}`;
}
