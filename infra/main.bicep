@description('Environment name prefix (e.g. aios, staging)')
param environmentName string = 'aios'

@description('Azure region')
param location string = 'uksouth'

@description('PostgreSQL admin password')
@secure()
param dbPassword string

@description('OpenAI API key')
@secure()
param openaiKey string

@description('Resend email API key')
@secure()
param resendKey string

@description('Stripe secret key')
@secure()
param stripeSecretKey string

@description('Container Registry login server (e.g. myacr.azurecr.io)')
param acrLoginServer string

// ============================================================================
// PostgreSQL Flexible Server
// ============================================================================

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: 'psql-${environmentName}'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'aiosadmin'
    administratorLoginPassword: dbPassword
    storage: {
      storageSizeGB: 32
    }
    version: '15'
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
  }
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgres
  name: 'vaultline_db'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services to connect
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ============================================================================
// Redis Cache
// ============================================================================

resource redis 'Microsoft.Cache/Redis@2022-06-01' = {
  name: 'redis-${environmentName}'
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

// ============================================================================
// Log Analytics Workspace (required by Container Apps Environment)
// ============================================================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-${environmentName}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ============================================================================
// Container Apps Environment
// ============================================================================

resource containerEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${environmentName}'
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

// ============================================================================
// API Container App
// ============================================================================

var databaseUrl = 'postgresql://aiosadmin:${dbPassword}@${postgres.properties.fullyQualifiedDomainName}/vaultline_db?sslmode=require'
var redisUrl = 'rediss://:${redis.listKeys().primaryKey}@${redis.properties.hostName}:6380'

resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'api-${environmentName}'
  location: location
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      secrets: [
        { name: 'database-url', value: databaseUrl }
        { name: 'redis-url', value: redisUrl }
        { name: 'openai-key', value: openaiKey }
        { name: 'resend-key', value: resendKey }
        { name: 'stripe-key', value: stripeSecretKey }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${acrLoginServer}/vaultline-api:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'REDIS_URL', secretRef: 'redis-url' }
            { name: 'OPENAI_API_KEY', secretRef: 'openai-key' }
            { name: 'RESEND_KEY', secretRef: 'resend-key' }
            { name: 'STRIPE_SECRET_KEY', secretRef: 'stripe-key' }
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3000' }
            { name: 'AGENT_MODE', value: 'shadow' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3000
              }
              initialDelaySeconds: 15
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// ============================================================================
// Outputs
// ============================================================================

// ============================================================================
// OS (Unified Intelligence OS) Container App — Next.js 14 app in /os
// ============================================================================

@description('Image tag for the OS container (commit SHA or "latest")')
param osImageTag string = 'latest'

@description('Companies House API key for FineGuard compliance')
@secure()
param companiesHouseApiKey string = ''

@description('HMAC secret used to sign outbound compliance webhooks')
@secure()
param webhookSigningSecret string = ''

@description('CRM webhook URL (Zapier/Make) for revenue lead forwarding')
param crmWebhookUrl string = ''

resource osApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'os-${environmentName}'
  location: location
  properties: {
    environmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        transport: 'http'
      }
      secrets: [
        { name: 'database-url', value: databaseUrl }
        { name: 'redis-url', value: redisUrl }
        { name: 'openai-key', value: openaiKey }
        { name: 'ch-key', value: companiesHouseApiKey }
        { name: 'webhook-secret', value: webhookSigningSecret }
      ]
    }
    template: {
      containers: [
        {
          name: 'os'
          image: '${acrLoginServer}/unified-intelligence-os:${osImageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'REDIS_URL', secretRef: 'redis-url' }
            { name: 'OPENAI_API_KEY', secretRef: 'openai-key' }
            { name: 'COMPANIES_HOUSE_API_KEY', secretRef: 'ch-key' }
            { name: 'WEBHOOK_SIGNING_SECRET', secretRef: 'webhook-secret' }
            { name: 'CRM_WEBHOOK_URL', value: crmWebhookUrl }
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3001' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 3001
              }
              initialDelaySeconds: 20
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output osUrl string = 'https://${osApp.properties.configuration.ingress.fqdn}'

// ============================================================================
// Original outputs
// ============================================================================

output apiUrl string = 'https://${apiApp.properties.configuration.ingress.fqdn}'
output postgresHost string = postgres.properties.fullyQualifiedDomainName
output redisHost string = redis.properties.hostName
output containerAppEnvId string = containerEnv.id
