import { createApp } from './app';

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 VaultLine Brand Suite Server');
  console.log('================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log('');
  console.log('API Endpoints:');
  console.log('  POST   /api/deployments/record');
  console.log('  GET    /api/deployments/status');
  console.log('  GET    /api/deployments/history');
  console.log('  POST   /api/lead');
  console.log('  GET    /api/admin/leads');
  console.log('  POST   /api/intake');
  console.log('  GET    /api/admin/intake-forms');
  console.log('  POST   /api/compliance-bundle');
  console.log('  GET    /api/admin/compliance-bundles');
  console.log('  POST   /api/contact');
  console.log('  GET    /api/admin/contacts');
  console.log('  PATCH  /api/contacts/:id');
  console.log('  GET    /api/health');
  console.log('  GET    /health');
  console.log('  GET    /api/internal/run-compliance-check');
  console.log('');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
