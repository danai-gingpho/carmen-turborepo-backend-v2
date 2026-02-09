#!/bin/bash

# Setup Nginx for Carmen API
# Run this script on the EC2 instance (Amazon Linux)

set -e

echo "=== Setting up Nginx for Carmen API ==="

# Detect Amazon Linux version and install nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."

    # Check if it's Amazon Linux 2023 (uses dnf)
    if command -v dnf &> /dev/null; then
        sudo dnf install -y nginx
    # Check if it's Amazon Linux 2 (uses amazon-linux-extras)
    elif command -v amazon-linux-extras &> /dev/null; then
        sudo amazon-linux-extras install -y nginx1
    # Fallback to yum
    else
        sudo yum install -y nginx
    fi
fi

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate (for testing)
if [ ! -f /etc/nginx/ssl/carmen-api.crt ]; then
    echo "Generating self-signed SSL certificate for API..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/carmen-api.key \
        -out /etc/nginx/ssl/carmen-api.crt \
        -subj "/C=AU/ST=NSW/L=Sydney/O=Carmen/CN=15.135.75.230"
fi

if [ ! -f /etc/nginx/ssl/carmen-app.crt ]; then
    echo "Generating self-signed SSL certificate for App..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/carmen-app.key \
        -out /etc/nginx/ssl/carmen-app.crt \
        -subj "/C=AU/ST=NSW/L=Sydney/O=Carmen/CN=15.135.75.230"
fi

# Backup original nginx.conf if not already backed up
if [ ! -f /etc/nginx/nginx.conf.original ]; then
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.original 2>/dev/null || true
fi

# Create a clean nginx.conf without built-in server block
# Amazon Linux's default nginx.conf has a server block that conflicts with our config
echo "Creating clean nginx.conf..."
sudo tee /etc/nginx/nginx.conf > /dev/null << 'NGINX_CONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    include /etc/nginx/conf.d/*.conf;
}
NGINX_CONF

# Remove default nginx configs
echo "Removing default nginx configs..."
sudo rm -f /etc/nginx/conf.d/default.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Copy nginx config to conf.d (Amazon Linux style)
echo "Copying nginx configuration..."
sudo cp ~/carmen-turborepo-backend-v2/nginx/carmen-api.conf /etc/nginx/conf.d/carmen-api.conf
sudo cp ~/carmen-turborepo-backend-v2/nginx/carmen-app.conf /etc/nginx/conf.d/carmen-app.conf
sudo cp ~/carmen-turborepo-backend-v2/nginx/carmen-platform.conf /etc/nginx/conf.d/carmen-platform.conf

# Test nginx config
echo "Testing nginx configuration..."
sudo nginx -t

# Start and enable nginx
echo "Starting nginx..."
sudo systemctl start nginx || sudo systemctl restart nginx
sudo systemctl enable nginx

# Check nginx status
echo ""
echo "Nginx status:"
sudo systemctl status nginx --no-pager -l | head -10

echo ""
echo "=== Nginx setup complete ==="
echo ""
echo "API is now accessible at:"
echo "  http://ec2-15-135-75-230.ap-southeast-2.compute.amazonaws.com"
echo "  https://ec2-15-135-75-230.ap-southeast-2.compute.amazonaws.com"
echo ""
echo "Note: HTTPS uses a self-signed certificate. For production, use Let's Encrypt."
