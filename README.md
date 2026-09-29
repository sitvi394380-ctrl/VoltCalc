# VoltCalc

VoltCalc is a free, local-first electrical engineering calculator for students. It provides Ohm’s Law, Power Factor, Transformer, Three-Phase Power, and electrical unit conversion tools, plus a formula library.

## Technology stack

- React and TypeScript
- Vite for development and production bundling
- Vitest for unit/regression tests
- Playwright for desktop and mobile Chromium E2E tests
- No backend, authentication, payments, analytics, or external runtime services

## Installation

Use Node.js 22+ and npm. The lockfile is committed for reproducible installs.

```text
npm ci
```

If the local npm cache is locked or unavailable, resolve that machine-level npm/Windows issue rather than changing the dependency lockfile.

## Development commands

```text
npm run dev
npm run preview
```

`npm run preview` serves the built `dist/` directory. The preview server is the local production-like server used for header and E2E checks.

## Testing commands

```text
npm run lint
npm run typecheck
npm test
npm run e2e
npm audit --audit-level=high
```

## Clean CI verification

GitHub Actions runs the clean verification pipeline in [.github/workflows/ci.yml](.github/workflows/ci.yml) on every push and pull request. It uses Ubuntu, Node.js 22, `npm ci` with the committed `package-lock.json`, Playwright Chromium, linting, type-checking, unit/regression tests, browser E2E tests, a production build, and the high-severity dependency audit.

The local Windows/npm environment has experienced cache and npm process errors during `npm ci`; those failures do not change the lockfile or dependencies. CI execution is the authoritative clean-install check. The workflow has not been executed from this environment.

The Playwright suite expects Chromium to be installed once with:

```text
npx playwright install chromium
```

## Production build

```text
npm run build
```

Deploy the generated `dist/` directory as a static site. There is no server-side runtime requirement.

## Deployment instructions

Recommended build settings for a static host:

- Install command: `npm ci`
- Build command: `npm run build`
- Publish/output directory: `dist`
- HTTPS: enable the provider’s managed TLS certificate and redirect HTTP to HTTPS

The application currently uses in-page navigation rather than separate client-side URL routes. Query parameters are ignored and are not required for normal operation.

## Security considerations

Production preview headers are configured in `vite.config.ts`:

- Content Security Policy restricted to same-origin scripts, styles, images, and connections
- `object-src 'none'`
- `base-uri 'self'`
- `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- Strict referrer policy
- Camera, microphone, and geolocation disabled through `Permissions-Policy`

The calculator implementation rejects invalid, non-finite, negative, zero-denominator, and mathematically inconsistent inputs where applicable. Rendering uses React-safe text/element rendering; no dynamic code execution or unsafe HTML insertion is used.

## Hosting security-header requirements

Static hosting must reproduce the production response headers because Vite configuration does not automatically configure a CDN or hosting provider. Configure:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

After HTTPS is enabled, add:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Only add HSTS after confirming every served subdomain is HTTPS-capable. HSTS has not been verified locally because the available production preview uses plain HTTP.

## Known limitations

- No HTTPS deployment is included in this repository, so HSTS cannot be locally verified.
- Screen-reader testing was not automated; keyboard, labels, semantic status output, and mobile layout are covered by browser smoke tests.
- The local environment has shown npm/Windows cache `EPERM` and npm exit-handler failures during clean-install attempts; these are environment issues, not dependency-audit findings.
- A hosting provider must configure TLS, HTTP-to-HTTPS redirect, security headers, and any CDN caching policy.
