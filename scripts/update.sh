#!/bin/bash
export ECR_REGISTRY=123456789012.dkr.ecr.ap-southeast-2.amazonaws.com                                                                                                                                                                                        
export IMAGE_TAG=latest  
cd ~/carmen-turborepo-backend-v2
git pull origin main
docker-compose pull
docker-compose up -d --remove-orphans
sudo cp nginx/carmen-api.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Update Complete!"