import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          
          // Feature chunks
          'dashboard': [
            './src/components/ComplianceDashboardPage.jsx',
            './src/components/DashboardPage.jsx',
            './src/components/QuickStatsCards.jsx',
            './src/components/QuickActions.jsx',
            './src/components/RecentActivity.jsx',
            './src/components/UpcomingDeadlines.jsx'
          ],
          'analytics': [
            './src/components/AnalyticsPage.jsx',
            './src/components/EnhancedAnalyticsPage.jsx',
            './src/components/FinesTrendChart.jsx',
            './src/components/CostAnalysisPieChart.jsx',
            './src/components/RiskAssessmentChart.jsx'
          ],
          'fine-management': [
            './src/components/DeadlineTrackerPage.jsx',
            './src/components/ComplianceCalendarPage.jsx',
            './src/components/FineDetailsPage.jsx',
            './src/components/AuditTrailPage.jsx'
          ],
          'documents': [
            './src/components/EnhancedDocumentVault.jsx',
            './src/components/DocumentsPage.jsx',
            './src/components/ReportsDashboardPage.jsx',
            './src/components/ExportCenterPage.jsx'
          ],
          'admin': [
            './src/components/AdminPage.jsx',
            './src/components/AdminControlPanel.jsx',
            './src/components/UserManagementPage.jsx',
            './src/components/PermissionsPage.jsx',
            './src/components/TeamPage.jsx'
          ],
          'auth': [
            './src/components/LoginPage.jsx',
            './src/components/RegisterPage.jsx',
            './src/components/ForgotPasswordPage.jsx'
          ],
          'error-pages': [
            './src/components/NotFoundPage.jsx',
            './src/components/ErrorPage.jsx',
            './src/components/MaintenancePage.jsx',
            './src/components/LoadingPage.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  }
})

