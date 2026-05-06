CREATE INDEX "compliance_bundles_company_number_idx" ON "compliance_bundles" USING btree ("company_number");--> statement-breakpoint
CREATE INDEX "contacts_status_idx" ON "contacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contacts_created_at_idx" ON "contacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deployment_status_environment_idx" ON "deployment_status" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "deployment_status_deployed_at_idx" ON "deployment_status" USING btree ("deployed_at");--> statement-breakpoint
CREATE INDEX "intake_forms_matter_type_idx" ON "intake_forms" USING btree ("matter_type");--> statement-breakpoint
CREATE INDEX "intake_forms_created_at_idx" ON "intake_forms" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");