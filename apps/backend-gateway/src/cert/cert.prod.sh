#!/bin/bash

# Generate SSL certificates for backend-gateway
# Run this script from the project root or cert directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$SCRIPT_DIR"

echo "=== Generating SSL Certificates ==="
echo "Output directory: $CERT_DIR"

# Option 1: Self-signed certificate (for testing/development)
generate_self_signed() {
    echo "Generating self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/key.pem" \
        -out "$CERT_DIR/cert.pem" \
        -subj "/C=AU/ST=NSW/L=Sydney/O=Carmen/CN=ec2-15-134-223-241.ap-southeast-2.compute.amazonaws.com"

    echo "Self-signed certificate generated:"
    echo "  - $CERT_DIR/cert.pem"
    echo "  - $CERT_DIR/key.pem"
}

# Option 2: Let's Encrypt certificate (for production)
generate_letsencrypt() {
    DOMAIN="ec2-15-134-223-241.ap-southeast-2.compute.amazonaws.com"
    EMAIL="admin@blueledgers.com"

    echo "Generating Let's Encrypt certificate for $DOMAIN..."

    # Stop any service using port 80
    sudo systemctl stop nginx 2>/dev/null || true
    docker stop $(docker ps -q) 2>/dev/null || true

    # Generate certificate
    sudo certbot certonly --standalone \
        -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --preferred-challenges http

    # Copy certificates to app directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/key.pem"
    sudo chown $(whoami):$(whoami) "$CERT_DIR/cert.pem" "$CERT_DIR/key.pem"
    chmod 644 "$CERT_DIR/cert.pem"
    chmod 600 "$CERT_DIR/key.pem"

    echo "Let's Encrypt certificate generated and copied to:"
    echo "  - $CERT_DIR/cert.pem"
    echo "  - $CERT_DIR/key.pem"
}

# Main
case "${1:-self-signed}" in
    self-signed)
        generate_self_signed
        ;;
    letsencrypt)
        generate_letsencrypt
        ;;
    *)
        echo "Usage: $0 [self-signed|letsencrypt]"
        echo "  self-signed  - Generate self-signed certificate (default)"
        echo "  letsencrypt  - Generate Let's Encrypt certificate (requires port 80)"
        exit 1
        ;;
esac

echo ""
echo "=== Certificate Generation Complete ==="
