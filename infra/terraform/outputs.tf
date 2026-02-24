output "app_service_url" {
  value       = "https://${azurerm_linux_web_app.main.default_hostname}"
  description = "FineGuard application URL"
}

output "key_vault_uri" {
  value       = azurerm_key_vault.main.vault_uri
  description = "Azure Key Vault URI"
}

output "postgres_fqdn" {
  value       = azurerm_postgresql_flexible_server.main.fqdn
  description = "PostgreSQL Flexible Server FQDN"
}

output "storage_account_name" {
  value       = azurerm_storage_account.audit.name
  description = "Audit storage account name"
}

output "form_recognizer_endpoint" {
  value       = azurerm_cognitive_account.form_recognizer.endpoint
  description = "Form Recognizer endpoint"
}

output "app_insights_connection_string" {
  value     = azurerm_application_insights.main.connection_string
  sensitive = true
}

output "deploy_instructions" {
  value = <<-EOT
    # Deployment Instructions
    # 1. Set Key Vault secrets (see infra/scripts/set-keyvault-secrets.sh)
    # 2. Run database migrations:
    #    az webapp ssh -n ${azurerm_linux_web_app.main.name} -g ${azurerm_resource_group.main.name}
    #    node -e "require('./server/db/migrate.ts')"
    # 3. Verify WORM immutability:
    #    ./infra/scripts/verify-worm.sh ${azurerm_storage_account.audit.name}
  EOT
}
