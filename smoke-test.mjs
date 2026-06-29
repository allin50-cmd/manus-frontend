#!/usr/bin/env node

const BASE_URL = process.env.TEST_URL || 'https://manus-frontend-c9li.vercel.app';

const routes = [
  { path: '/os/contacts/new', name: 'Contacts Create' },
  { path: '/os/tasks/new', name: 'Tasks Create' },
  { path: '/os/calls/new', name: 'Calls Create' },
  { path: '/os/messages/new', name: 'Messages Create' },
  { path: '/os/money/quotes/new', name: 'Quotes Create' },
  { path: '/os/money/invoices/new', name: 'Invoices Create' },
  { path: '/os/documents/upload', name: 'Documents Upload' },
];

const results = {};

async function testRoute(path, name) {
  const url = `${BASE_URL}${path}`;
  const result = {
    route: path,
    name,
    status: null,
    redirectToLogin: false,
    requiresAuth: false,
    pass: false,
    error: null,
  };

  try {
    // Don't follow redirects automatically to see the actual response
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Smoke Test/1.0',
      },
    });

    result.status = response.status;

    // Check if it's a redirect to login (307/302 with Location: /login)
    if ([307, 302].includes(response.status)) {
      const location = response.headers.get('location');
      if (location && location.includes('/login')) {
        result.redirectToLogin = true;
        result.requiresAuth = true;
        result.pass = true; // Correctly redirects to login
      }
    } else if (response.status === 200) {
      // If we got a 200, check if the page has a form
      const html = await response.text();
      const hasForm = html.includes('<form');
      const hasInputs = /<(?:input|select|textarea)/i.test(html);
      result.pass = hasForm && hasInputs;

      if (!result.pass) {
        result.error = 'Form elements not found';
      }
    } else if (response.status === 403) {
      // 403 usually means auth middleware intercepted
      result.requiresAuth = true;
      result.pass = true; // Protected route working
    }
  } catch (err) {
    result.error = err.message;
  }

  results[path] = result;
  return result;
}

async function testLoginPage() {
  try {
    const response = await fetch(`${BASE_URL}/login`);
    const html = await response.text();
    const hasForm = html.includes('<form');
    const hasLoginInput = html.includes('type="password"') || html.includes('type="text"');

    return {
      accessible: response.status === 200,
      hasForm,
      hasLoginInput,
    };
  } catch (err) {
    return {
      accessible: false,
      error: err.message,
    };
  }
}

async function testDashboard() {
  try {
    // Don't follow redirects
    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    });

    return {
      status: response.status,
      redirectsToLogin: response.status === 307 && response.headers.get('location')?.includes('/login'),
      requiresAuth: [307, 302, 403].includes(response.status),
    };
  } catch (err) {
    return {
      error: err.message,
    };
  }
}

async function runTests() {
  console.log(`\n🧪 Phase 4 Smoke Tests - ${BASE_URL}\n`);

  // Test login page
  console.log('📋 Verifying authentication system...\n');
  const login = await testLoginPage();
  if (login.accessible) {
    console.log('✅ /login page is accessible');
  } else {
    console.log('❌ /login page failed:', login.error);
  }

  // Test protected route behavior
  const dashboard = await testDashboard();
  if (dashboard.redirectsToLogin) {
    console.log('✅ /dashboard correctly redirects to /login (auth required)\n');
  } else {
    console.log(`⚠️  /dashboard status: ${dashboard.status}\n`);
  }

  // Test create routes
  console.log('🧪 Testing 7 create routes...\n');

  for (const route of routes) {
    const result = await testRoute(route.path, route.name);
    const status = result.pass ? '✅ PASS' : '❌ FAIL';
    let detail = '';

    if (result.requiresAuth) {
      detail = ' (auth required)';
    } else if (result.error) {
      detail = ` (${result.error})`;
    }

    console.log(`${status} | ${result.name.padEnd(20)} | ${result.route}${detail}`);
  }

  // Summary
  const passed = Object.values(results).filter((r) => r.pass).length;
  const total = Object.values(results).length;
  const allAuthRequired = Object.values(results).every((r) => r.requiresAuth);

  console.log('\n' + '='.repeat(70));
  console.log(
    `SUMMARY: ${passed}/${total} routes behaving correctly (auth-protected)`
  );
  console.log('='.repeat(70));

  // Table output
  console.log('\n| Route | Status | Protected | Notes |');
  console.log('|-------|--------|-----------|-------|');
  for (const [path, result] of Object.entries(results)) {
    const statusMark = result.pass ? '✅' : '❌';
    const isProtected = result.requiresAuth ? '✅ Yes' : '❌ No';
    const route = path.replace('/os/', '').padEnd(20);
    const notes = result.redirectToLogin ? 'Redirects to /login' : result.requiresAuth ? 'Auth protected' : 'Accessible';
    console.log(`| ${route} | ${statusMark} | ${isProtected} | ${notes} |`);
  }

  // Release decision
  console.log('\n' + '='.repeat(70));
  if (passed === total && allAuthRequired) {
    console.log('✅ RELEASE DECISION: Ready for Phase 5');
    console.log('   • All 7 create routes are properly protected');
    console.log('   • Authentication middleware is working correctly');
    console.log('   • Manual testing with valid credentials recommended');
  } else if (passed >= total * 0.8) {
    console.log('⚠️  RELEASE DECISION: Ready with minor fixes');
  } else {
    console.log('❌ RELEASE DECISION: Do not proceed');
    console.log('   • Some routes failed authentication checks');
  }
  console.log('='.repeat(70) + '\n');

  process.exit(passed === total ? 0 : 1);
}

runTests();
