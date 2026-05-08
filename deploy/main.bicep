// =============================================================================
// ClerkOS v1.1 — Main Bicep Infrastructure Template
// Deploys all Azure resources for a complete ClerkOS environment.
//
// Usage:
//   az group create --name rg-clerkos-<env> --location uksouth
//   az deployment group create \
//     --resource-group rg-clerkos-<env> \
//     --template-file deploy/main.bicep \
//     --parameters @deploy/parameters.<env>.json
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
param dbAdminPassword string

@description('Azure AD B2C Tenant Name (e.g. contoso)')
param b2cTenantName string

@description('Azure AD B2C Application Client ID')
param b2cClientId string

@description('Initial tenant slug for bootstrapping')
param initialTenantSlug string = 'default'

// =============================================================================
// Naming — {appName}-{environment}-{resource}
// =============================================================================

var prefix = '${appName}-${environment}'
var pgServerName       = '${prefix}-pg'
var pgDbName           = '${prefix}-db'
var storageAccountName = replace('${appName}${environment}docs', '-', '')
var serviceBusNsName   = '${prefix}-sb'
var acrName            = replace('${appName}${environment}cr', '-', '')
var containerAppEnvName = '${prefix}-cae'
var containerAppName   = '${prefix}-api'
var staticWebAppName   = '${prefix}-web'
var keyVaultName       = '${prefix}-kv'
var logAnalyticsName   = '${prefix}-log'
var appInsightsName    = '${prefix}-ai'
var dbAdminLogin       = '${appName}admin'

// =============================================================================
// Log Analytics
// =============================================================================

var resourceTags = {
  environment: environment
  application: 'vaultline-brand-suite'
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: resourceTags
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
  tags: resourceTags
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
  tags: resourceTags
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
  name: 'db-admin-password'
  properties: { value: dbAdminPassword }
}

resource kvSecretAppInsights 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'application-insights-connection-string'
  properties: { value: appInsights.properties.ConnectionString }
}

// DATABASE_URL stored as a secret so Container App can reference it
resource kvSecretDatabaseUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: 'postgresql://${dbAdminLogin}:${dbAdminPassword}@${pgServerName}.postgres.database.azure.com/${pgDbName}?sslmode=require'
  }
}

resource sbRootRule 'Microsoft.ServiceBus/namespaces/authorizationRules@2022-10-01-preview' existing = {
  parent: serviceBusNs
  name: 'RootManageSharedAccessKey'
}

resource kvSecretServiceBus 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'service-bus-connection-string'
  properties: {
    value: sbRootRule.listKeys().primaryConnectionString
  }
}

// =============================================================================
// Azure Database for PostgreSQL Flexible Server
// =============================================================================

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: pgServerName
  location: location
  tags: resourceTags
  sku: {
    name: environment == 'prod' ? 'Standard_D4ds_v5' : 'Standard_B2ms'
    tier: environment == 'prod' ? 'GeneralPurpose' : 'Burstable'
  }
  properties: {
    administratorLogin: dbAdminLogin
    administratorLoginPassword: dbAdminPassword
    version: '16'
    storage: {
      storageSizeGB: environment == 'prod' ? 128 : 32
    }
    backup: {
      backupRetentionDays: environment == 'prod' ? 35 : 7
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: environment == 'prod' ? 'ZoneRedundant' : 'Disabled'
    }
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: pgServer
  name: pgDbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services to reach Postgres (dev/staging only — use VNet in prod)
resource pgFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = if (environment != 'prod') {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// =============================================================================
// Blob Storage (immutable legal document retention)
// =============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  tags: resourceTags
  sku: { name: environment == 'prod' ? 'Standard_GRS' : 'Standard_LRS' }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    isVersioningEnabled: true
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
    immutableStorageWithVersioning: environment == 'prod' ? { enabled: true } : null
  }
}

// =============================================================================
// Service Bus
// =============================================================================

resource serviceBusNs 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusNsName
  location: location
  tags: resourceTags
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

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: resourceTags
  sku: { name: environment == 'prod' ? 'Premium' : 'Basic' }
  properties: { adminUserEnabled: true }
}

// =============================================================================
// Container Apps (tRPC / Express API)
// =============================================================================

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  tags: resourceTags
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
  tags: resourceTags
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/database-url'
          identity: 'system'
        }
        {
          name: 'service-bus-connection'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/service-bus-connection-string'
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
          image: '${acr.properties.loginServer}/clerkos-api:latest'
          resources: {
            cpu: json(environment == 'prod' ? '1.0' : '0.5')
            memory: environment == 'prod' ? '2Gi' : '1Gi'
          }
          env: [
            { name: 'NODE_ENV',                          value: environment == 'prod' ? 'production' : environment }
            { name: 'PORT',                              value: '3000' }
            { name: 'DATABASE_URL',                      secretRef: 'database-url' }
            { name: 'AZURE_SERVICE_BUS_CONNECTION_STRING', secretRef: 'service-bus-connection' }
            { name: 'AZURE_B2C_TENANT_NAME',             value: b2cTenantName }
            { name: 'AZURE_B2C_CLIENT_ID',               value: b2cClientId }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
            { name: 'DEFAULT_TENANT_SLUG',               value: initialTenantSlug }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/ping'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 30
              failureThreshold: 3
            }
          ]
        }
      ]
    }
  }
}

// =============================================================================
// Key Vault RBAC — grant Container App's managed identity secret read access
// Role: Key Vault Secrets User (4633458b-17de-408a-b874-0445c86b69e6)
// =============================================================================

resource kvSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, containerApp.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// Static Web App (React frontend)
// =============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  sku: { name: environment == 'prod' ? 'Standard' : 'Free' }
  properties: {}
}

// =============================================================================
// Outputs
// =============================================================================

output containerAppUrl        string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output staticWebAppUrl        string = 'https://${staticWebApp.properties.defaultHostname}'
output acrLoginServer         string = acr.properties.loginServer
output keyVaultUri            string = keyVault.properties.vaultUri
output appInsightsConnStr     string = appInsights.properties.ConnectionString
output pgServerFqdn           string = pgServer.properties.fullyQualifiedDomainName
