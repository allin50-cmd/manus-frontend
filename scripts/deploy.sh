#!/bin/bash
set -e

REGISTRY=acraios8e68d8.azurecr.io
REPO=os-app
APP=os-aios
RG=rg-unified-os

TAG=$(git rev-parse --short HEAD)
IMG="$REGISTRY/$REPO:$TAG"

echo "Building $IMG ..."
az acr build --registry acraios8e68d8 --image "$REPO:$TAG" --file os/Dockerfile os/

echo ""
echo "Deploying $IMG to $APP..."
az containerapp update \
  --name "$APP" \
  --resource-group "$RG" \
  --image "$IMG" \
  --set-env-vars DEMO_MODE=true

echo ""
echo "Done. Revision $TAG live in ~30-60s. Visit:"
echo "  https://os-aios.wittysea-4e7f0631.uksouth.azurecontainerapps.io/api/demo/login"
