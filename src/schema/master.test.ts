import { describe, it, expect } from 'vitest';
import master from './master.json';

// ─── top-level shape ──────────────────────────────────────────────────────────

describe('master.json – top-level', () => {
  it('has required top-level keys', () => {
    expect(master).toHaveProperty('product');
    expect(master).toHaveProperty('version');
    expect(master).toHaveProperty('frontend');
    expect(master).toHaveProperty('backend');
    expect(master).toHaveProperty('infrastructure');
  });

  it('product is FineGuard', () => {
    expect(master.product).toBe('FineGuard');
  });

  it('version follows semver', () => {
    expect(master.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ─── frontend ─────────────────────────────────────────────────────────────────

describe('master.json – frontend', () => {
  const { frontend } = master;

  it('uses the correct framework', () => {
    expect(frontend.framework).toBe('React 18');
  });

  it('uses wouter for routing', () => {
    expect(frontend.routing).toBe('wouter 3');
  });

  it('uses Tailwind CSS for styling', () => {
    expect(frontend.styling).toBe('Tailwind CSS 3');
  });

  it('has PWA section', () => {
    expect(frontend).toHaveProperty('pwa');
  });

  it('PWA manifest start_url is /app', () => {
    expect(frontend.pwa.manifest.start_url).toBe('/app');
  });

  it('PWA manifest theme_color is the brand blue', () => {
    expect(frontend.pwa.manifest.theme_color).toBe('#1d4ed8');
  });

  it('has both marketing and portal route groups', () => {
    expect(frontend.routes).toHaveProperty('marketing');
    expect(frontend.routes).toHaveProperty('portal');
  });

  it('marketing routes are all non-empty', () => {
    expect(frontend.routes.marketing.length).toBeGreaterThan(0);
    frontend.routes.marketing.forEach((r) => {
      expect(r.path).toBeTruthy();
      expect(r.page).toBeTruthy();
    });
  });

  it('portal routes are all non-empty', () => {
    expect(frontend.routes.portal.length).toBeGreaterThan(0);
    frontend.routes.portal.forEach((r) => {
      expect(r.path).toBeTruthy();
      expect(r.page).toBeTruthy();
    });
  });

  it('portal routes include Deploy and Dashboard', () => {
    const paths = frontend.routes.portal.map((r) => r.path);
    expect(paths).toContain('/app/deploy');
    expect(paths).toContain('/app/dashboard');
  });

  it('all fineguard components have a path', () => {
    frontend.components.fineguard.forEach((c) => {
      expect(c.path).toMatch(/^src\//);
    });
  });

  it('usePWAInstall hook is declared', () => {
    const hook = frontend.hooks.find((h) => h.name === 'usePWAInstall');
    expect(hook).toBeDefined();
    expect(hook?.exports).toContain('canInstall');
    expect(hook?.exports).toContain('isInstalled');
    expect(hook?.exports).toContain('promptInstall');
  });

  it('authentication provider mentions Entra ID', () => {
    expect(frontend.authentication.provider).toContain('Entra ID');
  });

  it('roles include FineGuard.Admin', () => {
    expect(frontend.roles.practice).toContain('FineGuard.Admin');
  });
});

// ─── backend ──────────────────────────────────────────────────────────────────

describe('master.json – backend', () => {
  const { backend } = master;

  it('runtime is Azure Functions', () => {
    expect(backend.runtime).toContain('Azure Functions');
  });

  it('has at least 10 endpoints', () => {
    expect(backend.endpoints.length).toBeGreaterThanOrEqual(10);
  });

  it('every endpoint has method and path', () => {
    backend.endpoints.forEach((e) => {
      expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(e.method);
      expect(e.path).toMatch(/^\/api\//);
    });
  });

  it('POST /api/deploy is defined', () => {
    const ep = backend.endpoints.find((e) => e.path === '/api/deploy' && e.method === 'POST');
    expect(ep).toBeDefined();
  });

  it('database has Deployments and Settings containers', () => {
    const names = backend.database.containers.map((c) => c.name);
    expect(names).toContain('Deployments');
    expect(names).toContain('Settings');
  });

  it('Deployments container uses /ownerId partition key', () => {
    const dep = backend.database.containers.find((c) => c.name === 'Deployments');
    expect(dep?.partitionKey).toBe('/ownerId');
  });
});

// ─── infrastructure ───────────────────────────────────────────────────────────

describe('master.json – infrastructure', () => {
  const { infrastructure } = master;

  it('IaC is Bicep', () => {
    expect(infrastructure.iac).toBe('Bicep');
  });

  it('has dev, staging, prod environments', () => {
    expect(infrastructure.environments).toEqual(expect.arrayContaining(['dev', 'staging', 'prod']));
  });

  it('CI/CD provider is GitHub Actions', () => {
    expect(infrastructure.cicd.provider).toBe('GitHub Actions');
  });

  it('required secrets include SWA tokens and COSMOS_KEY', () => {
    const secrets = infrastructure.cicd.requiredSecrets;
    expect(secrets).toContain('SWA_TOKEN_PROD');
    expect(secrets).toContain('COSMOS_KEY');
    expect(secrets).toContain('APPINSIGHTS_CONNECTION_STRING');
  });

  it('hosting navigationFallback is /index.html', () => {
    expect(infrastructure.hosting.navigationFallback).toBe('/index.html');
  });

  it('resources list includes Cosmos DB', () => {
    const types = infrastructure.resources.map((r) => r.type);
    expect(types).toContain('Microsoft.DocumentDB/databaseAccounts');
  });
});
