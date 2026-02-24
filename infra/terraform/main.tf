###############################################################################
# FineGuard MTD — Azure Infrastructure (Terraform)
# Provisions: App Service, PostgreSQL, Storage (WORM), Key Vault,
#             Form Recognizer, Application Insights, Service Bus
###############################################################################

terraform {
  required_version = ">= 1.6"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  # Remote state — update with your backend configuration
  # backend "azurerm" {
  #   resource_group_name  = "tfstate-rg"
  #   storage_account_name = "tfstatefineguard"
  #   container_name       = "tfstate"
  #   key                  = "fineguard.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# ─── Variables ─────────────────────────────────────────────────────────────────

variable "environment" {
  type        = string
  description = "Environment: dev, staging, prod"
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
}

variable "location" {
  type        = string
  description = "Azure region (UK South for data residency)"
  default     = "uksouth"
}

variable "project" {
  type    = string
  default = "fineguard"
}

variable "postgres_admin_password" {
  type      = string
  sensitive = true
}

variable "local_encryption_key" {
  type      = string
  sensitive = true
  description = "32-byte AES-256 key (hex) for token encryption"
}

variable "hmrc_client_id" {
  type      = string
  sensitive = true
}

variable "hmrc_client_secret" {
  type      = string
  sensitive = true
}

variable "xero_client_id" {
  type      = string
  sensitive = true
}

variable "xero_client_secret" {
  type      = string
  sensitive = true
}

# ─── Locals ───────────────────────────────────────────────────────────────────

locals {
  prefix = "${var.project}-${var.environment}"
  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
    data_class  = "financial"
  }
}

# ─── Resource Group ───────────────────────────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = "${local.prefix}-rg"
  location = var.location
  tags     = local.tags
}

# ─── App Service Plan ─────────────────────────────────────────────────────────

resource "azurerm_service_plan" "main" {
  name                = "${local.prefix}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.environment == "prod" ? "P2v3" : "B2"
  tags                = local.tags
}

# ─── App Service ──────────────────────────────────────────────────────────────

resource "azurerm_linux_web_app" "main" {
  name                = "${local.prefix}-app"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true
  tags                = local.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on        = true
    http2_enabled    = true
    app_command_line = "node --loader ts-node/esm server/index.ts"

    application_stack {
      node_version = "20-lts"
    }

    cors {
      allowed_origins = ["https://${local.prefix}-app.azurewebsites.net"]
    }
  }

  app_settings = {
    NODE_ENV                       = var.environment
    WEBSITES_PORT                  = "3000"
    DATABASE_URL                   = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=database-url)"
    LOCAL_ENCRYPTION_KEY           = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=local-encryption-key)"
    AZURE_STORAGE_CONNECTION_STRING = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=storage-connection-string)"
    AZURE_KEY_VAULT_URL            = azurerm_key_vault.main.vault_uri
    AZURE_FORM_RECOGNIZER_ENDPOINT = azurerm_cognitive_account.form_recognizer.endpoint
    AZURE_FORM_RECOGNIZER_KEY      = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=form-recognizer-key)"
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.main.connection_string
    HMRC_CLIENT_ID                 = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=hmrc-client-id)"
    HMRC_CLIENT_SECRET             = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=hmrc-client-secret)"
    HMRC_ENVIRONMENT               = var.environment == "prod" ? "production" : "sandbox"
    XERO_CLIENT_ID                 = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=xero-client-id)"
    XERO_CLIENT_SECRET             = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=xero-client-secret)"
    AUDIT_BLOB_CONTAINER           = "fineguard-audit"
  }

  logs {
    http_logs {
      retention_in_days = 30
    }
    application_logs {
      file_system_level = "Warning"
    }
  }
}

# ─── PostgreSQL Flexible Server ───────────────────────────────────────────────

resource "random_string" "postgres_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "${local.prefix}-pg-${random_string.postgres_suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  version             = "16"
  administrator_login    = "fineguard_admin"
  administrator_password = var.postgres_admin_password
  storage_mb          = 32768
  sku_name            = var.environment == "prod" ? "GP_Standard_D4s_v3" : "B_Standard_B2s"
  backup_retention_days = 7
  geo_redundant_backup_enabled = var.environment == "prod"
  tags                = local.tags

  high_availability {
    mode = var.environment == "prod" ? "ZoneRedundant" : "Disabled"
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "fineguard"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_GB.utf8"
}

resource "azurerm_postgresql_flexible_server_configuration" "ssl_enforcement" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# ─── Storage Account (with WORM immutability) ─────────────────────────────────

resource "azurerm_storage_account" "audit" {
  name                     = replace("${local.prefix}audit", "-", "")
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "prod" ? "GRS" : "LRS"
  min_tls_version          = "TLS1_2"
  allow_nested_items_to_be_public = false
  tags                     = local.tags

  blob_properties {
    versioning_enabled = true
    change_feed_enabled = true
    delete_retention_policy {
      days = 90
    }
    container_delete_retention_policy {
      days = 90
    }
  }
}

resource "azurerm_storage_container" "audit" {
  name                  = "fineguard-audit"
  storage_account_name  = azurerm_storage_account.audit.name
  container_access_type = "private"
}

# WORM immutability policy (time-based retention: 7 years = 2557 days)
resource "azurerm_storage_management_policy" "worm" {
  storage_account_id = azurerm_storage_account.audit.id

  rule {
    name    = "audit-retention-7-years"
    enabled = true

    filters {
      blob_types   = ["blockBlob"]
      prefix_match = ["fineguard-audit"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 2557
      }
    }
  }
}

# ─── Key Vault ────────────────────────────────────────────────────────────────

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                        = "${local.prefix}-kv"
  resource_group_name         = azurerm_resource_group.main.name
  location                    = azurerm_resource_group.main.location
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  soft_delete_retention_days  = 90
  purge_protection_enabled    = true
  tags                        = local.tags

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = ["Get", "List", "Set", "Delete", "Backup", "Restore", "Recover"]
    certificate_permissions = ["Get", "List", "Import"]
    key_permissions = ["Get", "List", "Create", "Delete", "Encrypt", "Decrypt"]
  }

  # App Service managed identity access
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = azurerm_linux_web_app.main.identity[0].principal_id

    secret_permissions = ["Get", "List"]
  }
}

# Secrets in Key Vault
resource "azurerm_key_vault_secret" "postgres_url" {
  name         = "database-url"
  value        = "postgresql://fineguard_admin:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/fineguard?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "encryption_key" {
  name         = "local-encryption-key"
  value        = var.local_encryption_key
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "storage_connection" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.audit.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "hmrc_client_id" {
  name         = "hmrc-client-id"
  value        = var.hmrc_client_id
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "hmrc_client_secret" {
  name         = "hmrc-client-secret"
  value        = var.hmrc_client_secret
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "xero_client_id" {
  name         = "xero-client-id"
  value        = var.xero_client_id
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "xero_client_secret" {
  name         = "xero-client-secret"
  value        = var.xero_client_secret
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "form_recognizer_key" {
  name         = "form-recognizer-key"
  value        = azurerm_cognitive_account.form_recognizer.primary_access_key
  key_vault_id = azurerm_key_vault.main.id
}

# ─── Form Recognizer (Document Intelligence) ──────────────────────────────────

resource "azurerm_cognitive_account" "form_recognizer" {
  name                = "${local.prefix}-formrec"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  kind                = "FormRecognizer"
  sku_name            = var.environment == "prod" ? "S0" : "F0"
  tags                = local.tags
}

# ─── Application Insights ─────────────────────────────────────────────────────

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.prefix}-laws"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 90
  tags                = local.tags
}

resource "azurerm_application_insights" "main" {
  name                = "${local.prefix}-appinsights"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"
  tags                = local.tags
}

# ─── Service Bus (for queuing heavy workloads) ────────────────────────────────

resource "azurerm_servicebus_namespace" "main" {
  name                = "${local.prefix}-sb"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.environment == "prod" ? "Standard" : "Basic"
  tags                = local.tags
}

resource "azurerm_servicebus_queue" "pdf_processing" {
  name         = "pdf-processing"
  namespace_id = azurerm_servicebus_namespace.main.id
  max_delivery_count = 3
  message_time_to_live = "P7D"
}

resource "azurerm_servicebus_queue" "mtd_submissions" {
  name         = "mtd-submissions"
  namespace_id = azurerm_servicebus_namespace.main.id
  max_delivery_count = 3
  message_time_to_live = "P1D"
}
