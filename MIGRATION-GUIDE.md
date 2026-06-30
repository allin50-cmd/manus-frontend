# Migration from Manus to Azure Static Web Apps

This document outlines how to migrate from your existing Manus deployment to Azure Static Web Apps.

## Current Deployments

Your FineGuard application is currently deployed at:
- **Production:** https://zhoqgoan.manus.space/
- **Compliance Environment:** https://compliance-t2rtvc.manus.space/

## Migration Strategy

You have three options for migrating to Azure:

### Option 1: Parallel Deployment (Recommended)

Run both deployments simultaneously during transition.

**Benefits:**
- Zero downtime
- Easy rollback
- Test Azure deployment thoroughly
- Gradual traffic migration

**Steps:**
1. Deploy to Azure using `./deploy-azure.sh`
2. Test Azure deployment thoroughly
3. Update DNS to point to Azure (when ready)
4. Keep Manus deployment as backup
5. Decommission Manus after stable period

**Timeline:** 2-4 weeks

---

### Option 2: Direct Migration

Switch entirely to Azure Static Web Apps.

**Benefits:**
- Simplified infrastructure
- Single deployment pipeline
- Cost optimization

**Steps:**
1. Document current Manus configuration
2. Deploy to Azure
3. Configure custom domain on Azure
4. Update DNS immediately
5. Decommission Manus

**Timeline:** 1-2 weeks

---

### Option 3: Staged Migration

Migrate environments one at a time.

**Steps:**
1. Migrate compliance environment first
2. Test thoroughly
3. Migrate production
4. Decommission Manus

**Timeline:** 3-4 weeks

---

## Pre-Migration Checklist

Before migrating, ensure you have:

- [ ] **Documented current configuration**
  - Environment variables
  - API endpoints
  - Custom domains
  - SSL certificates

- [ ] **Backed up data**
  - Database exports (if applicable)
  - Configuration files
  - User data

- [ ] **Identified dependencies**
  - External APIs
  - Authentication services
  - CDN configurations
  - Custom headers/routing

- [ ] **Tested Azure deployment**
  - Run `./deploy-azure.sh` to staging
  - Verify all features work
  - Performance testing
  - Security testing

- [ ] **Communication plan**
  - Notify stakeholders
  - Prepare rollback plan
  - Schedule migration window

---

## Configuration Comparison

### Manus Deployment
```
URL: https://zhoqgoan.manus.space/
Platform: Manus.space
Deployment: Manual or Manus-managed
SSL: Provided by Manus
CDN: Manus CDN
```

### Azure Static Web Apps
```
URL: https://[app-name]-[hash].azurestaticapps.net
     (or custom domain with Standard tier)
Platform: Azure
Deployment: Automated via GitHub Actions
SSL: Free Azure-managed certificate
CDN: Azure CDN (global)
```

---

## Migration Steps

### Step 1: Environment Variables

**Export from Manus:**
Document all environment variables used in your Manus deployment.

**Import to Azure:**
```bash
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names \
    "VITE_API_URL=https://api.example.com" \
    "VITE_ENV=production"
```

---

### Step 2: Custom Domain Setup (Standard Tier)

If using custom domains like `zhoqgoan.manus.space`:

**Azure Setup:**
```bash
# Upgrade to Standard tier
az staticwebapp update \
  --name fineguard \
  --resource-group fineguard-rg \
  --sku Standard

# Add custom domain
az staticwebapp hostname set \
  --name fineguard \
  --resource-group fineguard-rg \
  --hostname "zhoqgoan.manus.space"
```

**DNS Configuration:**
Add a CNAME record:
```
Type: CNAME
Name: zhoqgoan (or @)
Value: [your-azure-app].azurestaticapps.net
TTL: 3600
```

**Validation:**
Azure will provide a TXT record for domain validation.

---

### Step 3: API Integration

If your app connects to backend APIs:

**Update API endpoints:**
```javascript
// Before (hardcoded)
const API_URL = "https://api.manus.space";

// After (environment variable)
const API_URL = import.meta.env.VITE_API_URL;
```

**Set in Azure:**
```bash
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "VITE_API_URL=https://api.manus.space"
```

---

### Step 4: Authentication

If using authentication:

**Manus Authentication:**
- Document current auth provider
- Export user data if needed

**Azure Static Web Apps Authentication:**
Azure supports built-in auth providers:
- Azure Active Directory
- GitHub
- Twitter
- Google
- Custom OpenID Connect

**Configure:**
Update `staticwebapp.config.json`:
```json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/[tenant-id]",
          "clientIdSettingName": "AAD_CLIENT_ID",
          "clientSecretSettingName": "AAD_CLIENT_SECRET"
        }
      }
    }
  }
}
```

---

### Step 5: Routing Configuration

Both deployments should handle SPA routing.

**Current config** (`staticwebapp.config.json`):
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

This ensures all routes fall back to `index.html` for client-side routing.

---

### Step 6: DNS Cutover

**Preparation:**
1. Lower DNS TTL to 300 seconds (5 minutes) 24 hours before migration
2. Document current DNS records
3. Prepare new DNS records

**Cutover:**
```
# Before
zhoqgoan.manus.space → Manus platform

# After
zhoqgoan.manus.space → Azure Static Web Apps
```

**DNS Change:**
1. Update CNAME to point to Azure
2. Wait for DNS propagation (5-30 minutes with low TTL)
3. Monitor traffic

**Verification:**
```bash
# Check DNS propagation
dig zhoqgoan.manus.space

# Test HTTPS
curl -I https://zhoqgoan.manus.space
```

---

### Step 7: Monitoring

**Azure Monitoring:**
```bash
# View app insights
az monitor app-insights component show \
  --app fineguard \
  --resource-group fineguard-rg

# View metrics
az monitor metrics list \
  --resource /subscriptions/{subscription-id}/resourceGroups/fineguard-rg/providers/Microsoft.Web/staticSites/fineguard
```

**Set up alerts:**
```bash
az monitor metrics alert create \
  --name "fineguard-availability" \
  --resource-group fineguard-rg \
  --scopes /subscriptions/{subscription-id}/resourceGroups/fineguard-rg/providers/Microsoft.Web/staticSites/fineguard \
  --condition "avg Availability < 99" \
  --description "Alert when availability drops below 99%"
```

---

## Rollback Plan

If issues occur during migration:

**Immediate Rollback (DNS):**
```bash
# Revert DNS to Manus
# Update CNAME back to original value
```

**GitHub Actions Rollback:**
```bash
# Disable GitHub Actions workflow temporarily
gh workflow disable "Azure Static Web Apps CI/CD"

# Or re-run previous successful deployment
gh run list --limit 5
gh run rerun <previous-successful-run-id>
```

---

## Post-Migration Checklist

After successful migration:

- [ ] **Verify all functionality**
  - All pages load correctly
  - Forms submit successfully
  - API calls work
  - Authentication works
  - Images/assets load

- [ ] **Performance testing**
  - Page load times
  - API response times
  - Mobile performance

- [ ] **Security verification**
  - SSL certificate valid
  - Security headers present
  - No mixed content warnings

- [ ] **DNS verification**
  - All domains resolve correctly
  - HTTPS works on all domains
  - No redirect loops

- [ ] **Monitoring setup**
  - Azure Application Insights configured
  - Alerts configured
  - Logging working

- [ ] **Decommission Manus**
  - Keep for 2-4 weeks as backup
  - Export any logs/metrics
  - Cancel Manus subscription

---

## Cost Comparison

### Manus Platform
```
Cost: [Your current Manus cost]
Billing: [Your billing cycle]
```

### Azure Static Web Apps

**Free Tier:**
- $0/month
- 100GB bandwidth/month
- Unlimited apps
- Custom SSL
- No custom domains

**Standard Tier:**
- $9/month per app
- 100GB bandwidth included
- $0.20/GB additional
- 2 custom domains
- Private endpoints

**Estimated monthly cost:**
- Free tier: $0
- Standard tier (with custom domain): $9-15/month

---

## Timeline Example

### Week 1: Preparation
- [ ] Run `./check-azure-prereqs.sh`
- [ ] Install required tools
- [ ] Document Manus configuration
- [ ] Test local build

### Week 2: Azure Setup
- [ ] Run `./deploy-azure.sh`
- [ ] Configure environment variables
- [ ] Test Azure deployment
- [ ] Performance testing

### Week 3: Testing
- [ ] UAT on Azure environment
- [ ] Load testing
- [ ] Security testing
- [ ] Fix any issues

### Week 4: Migration
- [ ] Lower DNS TTL
- [ ] Final testing
- [ ] DNS cutover
- [ ] Monitor for 48 hours
- [ ] Keep Manus as backup

### Week 6-8: Stabilization
- [ ] Monitor Azure deployment
- [ ] Address any issues
- [ ] Optimize performance
- [ ] Decommission Manus

---

## Support During Migration

**Azure Support:**
- Azure Portal: https://portal.azure.com
- Azure CLI: `az staticwebapp --help`
- Documentation: https://docs.microsoft.com/azure/static-web-apps/

**Migration Help:**
- Review `AZURE-DEPLOYMENT-GUIDE.md` for detailed instructions
- Run `./check-azure-prereqs.sh` for environment validation
- Use GitHub Actions logs: `gh run view --log`

---

## Common Migration Issues

### Issue: Environment variables not working

**Solution:**
```bash
# List current settings
az staticwebapp appsettings list \
  --name fineguard \
  --resource-group fineguard-rg

# Vite requires VITE_ prefix
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "VITE_API_URL=https://api.example.com"

# Rebuild to pick up new variables
git commit --allow-empty -m "Trigger rebuild"
git push
```

### Issue: Custom domain not working

**Solution:**
1. Verify DNS CNAME: `dig zhoqgoan.manus.space`
2. Check Azure domain validation
3. Wait for SSL provisioning (up to 24 hours)
4. Check domain status:
   ```bash
   az staticwebapp hostname show \
     --name fineguard \
     --resource-group fineguard-rg \
     --hostname "zhoqgoan.manus.space"
   ```

### Issue: 404 errors on refresh

**Already fixed!** The `staticwebapp.config.json` includes:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

---

## Next Steps

1. **Review this migration plan** with your team
2. **Choose a migration strategy** (Parallel recommended)
3. **Follow AZURE-DEPLOYMENT-GUIDE.md** for deployment steps
4. **Test thoroughly** before DNS cutover
5. **Schedule migration window** during low-traffic period

Good luck with your migration!
