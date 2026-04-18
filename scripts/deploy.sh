#!/bin/bash
set -e

REGISTRY=acraios8e68d8.azurecr.io
IMAGE=os-app:latest
APP=os-aios
RG=rg-unified-os

echo "Deploying $REGISTRY/$IMAGE to $APP..."

az containerapp update \
  --name "$APP" \
  --resource-group "$RG" \
  --image "$REGISTRY/$IMAGE" \
  --set-env-vars DEMO_MODE=true

echo ""
echo "Done. Visit:"
echo "  https://os-aios.wittysea-4e7f0631.uksouth.azurecontainerapps.io/api/demo/login"
