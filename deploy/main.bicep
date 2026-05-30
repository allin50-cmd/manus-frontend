// =============================================================================
// ClerkOS v1.1 — Main Bicep Infrastructure Template
// Deploys all Azure resources for a complete ClerkOS environment.
// Usage: az deployment group create --resource-group rg-clerkos-<env>
//          --template-file deploy/main.bicep
//          --parameters @deploy/parameters.<env>.json
// =============================================================================

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Short application name used in resource naming')
param appName string = 'clerkos'

@description('Azure region')
param location string = resourceGroup().location

@description('PostgreSQL administrator password')
@secure()
param sqlAdminPassword string

@description('Azure AD B2C Tenant Name (e.g. contoso)')
param b2cTenantName string

@description('Azure AD B2C Application Client ID')
param b2cClientId string

@description('Initial tenant slug for bootstrapping')
param initialTenantSlug string = 'default'

// =============================================================================
// Naming convention: {appName}-{resource}-{environment}
// =============================================================================

var prefix = '${appName}-${environment}'
var pgServerName = '${prefix}-pg'
var pgDbName = '${prefix}-db'
var storageAccountName = replace('${appName}${environment}docs', '-', '')
var serviceBusNamespace = '${prefix}-sb'
var containerRegistryName = replace('${appName}${environment}cr', '-', '')
var containerAppEnvName = '${prefix}-cae'
var containerAppName = '${prefix}-api'
var staticWebAppName = '${prefix}-web'
var keyVaultName = '${prefix}-kv'
var logAnalyticsName = '${prefix}-log'
var appInsightsName = '${prefix}-ai'

// =============================================================================
// Log Analytics (dependency for Application Insights)
// =============================================================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: environment == 'prod' ? 90 : 30
  }
}

// =============================================================================
// Application Insights
// =============================================================================

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// =============================================================================
// Key Vault
// =============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: environment == 'prod' ? 90 : 7
  }
}

resource kvSecretDbPassword 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'pg-admin-password'
  properties: { value: sqlAdminPassword }
}

resource kvSecretDatabaseUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: 'postgresql://${appName}admin:${sqlAdminPassword}@${pgServer.properties.fullyQualifiedDomainName}:5432/${pgDbName}?sslmode=require'
  }
}

resource kvSecretAppInsights 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'application-insights-connection-string'
  properties: { value: appInsights.properties.ConnectionString }
}

// =============================================================================
// Azure Database for PostgreSQL Flexible Server
// Replaces Azure SQL Server — application uses the postgres wire protocol.
// =============================================================================

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: pgServerName
  location: location
  sku: {
    name: environment == 'prod' ? 'Standard_D4s_v3' : 'Standard_B1ms'
    tier: environment == 'prod' ? 'GeneralPurpose' : 'Burstable'
  }
  properties: {
    administratorLogin: '${appName}admin'
    administratorLoginPassword: sqlAdminPassword
    version: '16'
    storage: { storageSizeGB: environment == 'prod' ? 128 : 32 }
    backup: {
      backupRetentionDays: environment == 'prod' ? 35 : 7
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    highAvailability: { mode: environment == 'prod' ? 'ZoneRedundant' : 'Disabled' }
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: pgServer
  name: pgDbName
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services to connect (dev only — use private endpoint in prod)
resource pgFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = if (environment != 'prod') {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// =============================================================================
// Blob Storage (immutable for legal document retention)
// =============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: { name: environment == 'prod' ? 'Standard_GRS' : 'Standard_LRS' }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    isVersioningEnabled: true  // Required for immutability policies
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    isVersioningEnabled: true
    deleteRetentionPolicy: {
      enabled: true
      days: environment == 'prod' ? 365 : 30
    }
  }
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'clerkos-documents'
  properties: {
    publicAccess: 'None'
    // Time-based retention for legal compliance (prod only)
    immutableStorageWithVersioning: environment == 'prod' ? {
      enabled: true
    } : null
  }
}

// =============================================================================
// Service Bus (for bundle generation queue)
// =============================================================================

resource serviceBusNs 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusNamespace
  location: location
  sku: {
    name: environment == 'prod' ? 'Premium' : 'Standard'
    tier: environment == 'prod' ? 'Premium' : 'Standard'
  }
}

resource bundleQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNs
  name: 'clerkos-bundles'
  properties: {
    maxSizeInMegabytes: 1024
    defaultMessageTimeToLive: 'P14D'
    lockDuration: 'PT5M'
    maxDeliveryCount: 3
    deadLetteringOnMessageExpiration: true
  }
}

resource tasksQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNs
  name: 'clerkos-tasks'
  properties: {
    maxSizeInMegabytes: 1024
    defaultMessageTimeToLive: 'P7D'
    lockDuration: 'PT2M'
    maxDeliveryCount: 5
  }
}

// =============================================================================
// Container Registry
// =============================================================================

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  sku: { name: environment == 'prod' ? 'Premium' : 'Basic' }
  properties: { adminUserEnabled: false }
}

// =============================================================================
// Container Apps (API / tRPC server)
// =============================================================================

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      secrets: [
        {
          name: 'database-url'
          keyVaultUrl: 'https://${keyVaultName}.vault.azure.net/secrets/database-url'
          identity: 'system'
        }
        {
          name: 'service-bus-connection'
          keyVaultUrl: 'https://${keyVaultName}.vault.azure.net/secrets/service-bus-connection-string'
          identity: 'system'
        }
      ]
    }
    template: {
      scale: {
        minReplicas: environment == 'prod' ? 2 : 0
        maxReplicas: environment == 'prod' ? 10 : 3
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '100' } }
          }
        ]
      }
      containers: [
        {
          name: 'api'
          image: '${containerRegistryName}.azurecr.io/clerkos-api:latest'
          resources: {
            cpu: json(environment == 'prod' ? '1.0' : '0.5')
            memory: environment == 'prod' ? '2Gi' : '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: environment == 'prod' ? 'production' : environment }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'AZURE_SERVICE_BUS_CONNECTION_STRING', secretRef: 'service-bus-connection' }
            { name: 'AZURE_B2C_TENANT_NAME', value: b2cTenantName }
            { name: 'AZURE_B2C_CLIENT_ID', value: b2cClientId }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
          ]
        }
      ]
    }
  }
  identity: { type: 'SystemAssigned' }
}

// =============================================================================
// Static Web App (React frontend)
// =============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  sku: { name: environment == 'prod' ? 'Standard' : 'Free' }
  properties: {
    repositoryUrl: 'https://github.com/allin50-cmd/manus-frontend'
    branch: environment == 'prod' ? 'main' : 'claude/build-superlawclerk-engine-FvlUa'
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

// =============================================================================
// Outputs
// =============================================================================

output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output keyVaultUri string = keyVault.properties.vaultUri
output appInsightsConnectionString string = appInsights.properties.ConnectionString
