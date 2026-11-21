# FlowerDetailsFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.5.

## Development server

Use a supported Node release with the November 2026 security patches: 22.23.5+, 24.22.3+ or 26.13.1+ within those major versions. `.nvmrc` selects 24.22.3; it does not upgrade the installed runtime automatically.

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Testing

```bash
npm run test:coverage   # Vitest plus enforced coverage minimums
npm run test:e2e        # Playwright UI flows and WCAG AA checks (mocked API)
npm run test:full-stack # Playwright against the real Spring API and an in-memory H2 database
npm run validate        # All checks above, formatting, lint and production build
```

Install Playwright Chromium with `npx playwright install chromium` before running browser tests. The full-stack test expects `flower-details-backend` beside this repository and Java 21. It starts the backend with its test configuration on port 18080 and Angular on port 14200; it does not use the development database or `application-dev.properties`. On Windows, the backend Maven wrapper is launched through Git Bash (`C:\Program Files\Git\bin\bash.exe` by default); set `FLOWER_DETAILS_BASH` if Git Bash is elsewhere.

Mocked E2E tests start an isolated Angular server on port 14201 with an empty proxy configuration. They never reuse the development server. Set `FLOWER_DETAILS_BACKEND_DIR` to use a separate backend checkout for full-stack tests.

## Production security

Publish only `dist/flower-details-frontend/browser`, using `npm run build`. Production disables source maps and Angular debugging and generates a hash-based CSP through `security.autoCsp`. TypeScript and template checks are strict. Do not publish the repository or use `ng serve` for production.

`deployment/nginx.conf` is a tested example serving the build on port 8081, adding security headers, denying source/configuration files, and proxying `/api/` to a backend at `127.0.0.1:8080`. Adapt the upstream to the real deployment; in Docker, loopback refers to the same container. Configure HTTPS and HSTS at the TLS edge, and enable the backend's secure production cookies. This example does not configure TLS or deploy itself.

To reproduce the production browser tests locally with Docker and PowerShell:

```powershell
npm run build
$configPath = (Resolve-Path deployment/nginx.conf).Path
$buildPath = (Resolve-Path dist/flower-details-frontend/browser).Path
$containerId = docker run -d -p 127.0.0.1:14202:8081 --mount "type=bind,source=$configPath,target=/etc/nginx/nginx.conf,readonly" --mount "type=bind,source=$buildPath,target=/usr/share/nginx/html,readonly" nginx:stable-alpine
try {
  npx playwright test --config=playwright.production.config.ts --workers=2
} finally {
  docker stop $containerId
  docker rm $containerId
}
```

The production browser tests mock API responses; the separate full-stack suite verifies real backend authentication, authorization, CSRF and validation with H2. Browser upload limits (JPEG/PNG/WebP, 5 MiB per file, 20 MiB per batch, 10 files) improve feedback; the server must independently verify content and enforce its own limits. API error notifications render messages as text.

Frontend code and configuration are public. Keep credentials on the backend. Password hashing, database access, API rate limits, CORS, HttpOnly cookies and token expiry require server-side enforcement.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
