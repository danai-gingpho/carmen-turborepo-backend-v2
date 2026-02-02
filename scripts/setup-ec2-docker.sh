#!/bin/bash

# Setup Docker and AWS CLI on EC2 Ubuntu instance
# Run this on your EC2 instance: ./scripts/setup-ec2-docker.sh

set -e

echo "Updating system packages..."
sudo apt-get update -y

echo "Installing Docker..."
sudo apt-get install -y docker.io docker-compose

echo "Adding ubuntu user to docker group..."
sudo usermod -aG docker ubuntu

echo "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

echo "Installing AWS CLI..."
sudo apt-get install -y awscli

echo "Creating project directory..."
mkdir -p ~/carmen-turborepo-backend

echo ""
echo "=================================================="
echo "Setup complete!"
echo ""
echo "IMPORTANT: Log out and log back in for docker group to take effect"
echo "Or run: newgrp docker"
echo ""
echo "Next steps:"
echo "1. Clone the repository:"
echo "   git clone https://github.com/CarmenSoftware-organization/carmen-turborepo-backend.git ~/carmen-turborepo-backend"
echo ""
echo "2. Configure AWS credentials:"
echo "   aws configure"
echo ""
echo "3. Login to ECR:"
echo "   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 697697503013.dkr.ecr.ap-southeast-2.amazonaws.com"
echo "=================================================="
