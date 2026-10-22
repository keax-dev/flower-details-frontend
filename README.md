# FlowerDetailsFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.5.

## Development server

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

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
