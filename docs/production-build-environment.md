# Production Build Environment

The dashboard build must execute Next.js with `NODE_ENV=production`. The `npm run build` command now invokes `scripts/build-production.mjs`, which passes `NODE_ENV=production` to the Next.js build process even when a local shell or CI runner inherits a non-production value.

This wrapper is a defense in depth measure. It does not replace correct deployment configuration. In Vercel, remove manually configured `NODE_ENV` values from all environment scopes and allow the platform-managed production environment to apply during production and preview builds.

Validate any change with:

```bash
npm ci
npm test
npm run type-check
npm run build
```
