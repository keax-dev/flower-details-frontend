export function isApiRequest(url: string, apiBaseUrl: string): boolean {
  const paths = apiPaths(url, apiBaseUrl);
  return paths !== null && (paths.request === paths.base || paths.request.startsWith(`${paths.base}/`));
}

export function isApiEndpoint(url: string, apiBaseUrl: string, path: string): boolean {
  const paths = apiPaths(url, apiBaseUrl);
  return paths !== null && paths.request === `${paths.base}${path}`;
}

function apiPaths(url: string, apiBaseUrl: string): { request: string; base: string } | null {
  try {
    if (hasUnsafeCharacters(url) || hasUnsafeCharacters(apiBaseUrl)) return null;
    const relativeBase = apiBaseUrl.startsWith('/') && !apiBaseUrl.startsWith('//');
    if (relativeBase && (!url.startsWith('/') || url.startsWith('//'))) return null;
    const base = new URL(apiBaseUrl, 'https://frontend.invalid');
    const request = new URL(url, base);
    if (!['http:', 'https:'].includes(base.protocol) || request.origin !== base.origin || request.username || request.password) return null;
    if (base.search || base.hash || base.username || base.password || /%2f|%5c|%2e/i.test(request.pathname)) return null;
    return { request: request.pathname, base: base.pathname.replace(/\/$/, '') };
  } catch {
    return null;
  }
}

function hasUnsafeCharacters(value: string): boolean {
  for (const character of value) {
    if (character === '\\' || character.charCodeAt(0) <= 32) return true;
  }
  return false;
}
