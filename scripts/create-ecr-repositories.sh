#!/bin/bash

# Create ECR Repositories for Carmen Backend Services
# Usage: ./scripts/create-ecr-repositories.sh

set -e

AWS_REGION="ap-southeast-2"
IMAGE_PREFIX="carmen"

REPOSITORIES=(
  "backend-gateway"
  "micro-authen"
  "micro-cluster"
  "micro-license"
  "micro-reports"
  "micro-file"
  "micro-keycloak-api"
  "micro-tenant-inventory"
  "micro-tenant-master"
  "micro-tenant-procurement"
  "micro-tenant-recipe"
  "micro-log"
  "micro-notification"
  "micro-cronjob"
)

echo "Creating ECR repositories in region: ${AWS_REGION}"
echo "=================================================="

for repo in "${REPOSITORIES[@]}"; do
  REPO_NAME="${IMAGE_PREFIX}-${repo}"
  echo "Creating repository: ${REPO_NAME}"

  aws ecr create-repository \
    --repository-name "${REPO_NAME}" \
    --region "${AWS_REGION}" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    2>/dev/null || echo "  -> Repository ${REPO_NAME} already exists or error occurred"
done

echo ""
echo "=================================================="
echo "Done! ECR repositories created."
echo ""
echo "Registry URL: 697697503013.dkr.ecr.${AWS_REGION}.amazonaws.com"
echo ""
echo "To login to ECR:"
echo "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin 697697503013.dkr.ecr.${AWS_REGION}.amazonaws.com"
