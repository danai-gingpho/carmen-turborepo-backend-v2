#!/bin/bash
#
# WireGuard VPN Setup Script for Carmen Dev Team
# ================================================
# ติดตั้ง WireGuard server บน Amazon Linux 2023 และ generate client configs สำหรับ 5 dev machines
#
# Prerequisites (ต้องทำเองบน AWS Console ก่อน run script):
#   1. สร้าง EC2 instance (t3.micro) ใน VPC เดียวกับ Keycloak (subnet 172.31.16.0/20)
#   2. Security Group: เปิด UDP 51820 จาก 0.0.0.0/0 + SSH 22
#   3. ปิด Source/Destination Check บน EC2 instance (สำคัญมาก)
#
# Usage:
#   chmod +x wireguard-setup.sh
#   sudo ./wireguard-setup.sh
#
# Verification (บนเครื่อง dev หลัง import client config):
#   wg-quick up wg0
#   curl http://10.10.0.1/realms/CARMEN_realm/.well-known/openid-configuration

set -euo pipefail

# ==============================================================================
# Configuration
# ==============================================================================

WG_PORT=51820
WG_INTERFACE="wg0"
WG_DIR="/etc/wireguard"
VPN_SUBNET="10.10.0.0/24"
VPN_SERVER_IP="10.10.0.1"
VPC_CIDR="172.31.16.0/20"
VPC_DNS="172.31.0.2"
NUM_CLIENTS=5
CLIENT_PREFIX="dev"
OUTPUT_DIR="/root/wireguard-clients"

# ==============================================================================
# Preflight Checks
# ==============================================================================

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: ต้อง run ด้วย sudo หรือ root"
    echo "Usage: sudo $0"
    exit 1
fi

if [[ -f "${WG_DIR}/${WG_INTERFACE}.conf" ]]; then
    echo "WARNING: ${WG_DIR}/${WG_INTERFACE}.conf มีอยู่แล้ว"
    read -rp "ต้องการ overwrite? (y/N): " confirm
    if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
        echo "ยกเลิก"
        exit 0
    fi
    # Stop existing interface before overwriting
    wg-quick down "${WG_INTERFACE}" 2>/dev/null || true
fi

# Detect the main network interface for NAT
SERVER_INTERFACE=$(ip -o -4 route show to default | awk '{print $5}' | head -1)
if [[ -z "${SERVER_INTERFACE}" ]]; then
    echo "ERROR: ไม่พบ default network interface"
    exit 1
fi
echo "Detected network interface: ${SERVER_INTERFACE}"

# Get server public IP for client configs
SERVER_PUBLIC_IP=$(curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)
if [[ -z "${SERVER_PUBLIC_IP}" ]]; then
    # Fallback: try IMDSv2
    TOKEN=$(curl -s --connect-timeout 5 -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null || true)
    if [[ -n "${TOKEN}" ]]; then
        SERVER_PUBLIC_IP=$(curl -s --connect-timeout 5 -H "X-aws-ec2-metadata-token: ${TOKEN}" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)
    fi
fi
if [[ -z "${SERVER_PUBLIC_IP}" ]]; then
    echo "WARNING: ไม่สามารถดึง public IP จาก EC2 metadata ได้"
    read -rp "กรุณาใส่ server public IP: " SERVER_PUBLIC_IP
    if [[ -z "${SERVER_PUBLIC_IP}" ]]; then
        echo "ERROR: ต้องระบุ server public IP"
        exit 1
    fi
fi
echo "Server public IP: ${SERVER_PUBLIC_IP}"

# ==============================================================================
# 1. Install WireGuard
# ==============================================================================

echo ""
echo "=========================================="
echo " 1/5  Installing WireGuard"
echo "=========================================="

dnf install -y wireguard-tools

# Install qrencode for QR code generation (optional)
dnf install -y qrencode 2>/dev/null || echo "NOTE: qrencode ไม่สามารถติดตั้งได้ — จะข้าม QR code generation"

echo "WireGuard installed successfully"

# ==============================================================================
# 2. Enable IP Forwarding
# ==============================================================================

echo ""
echo "=========================================="
echo " 2/5  Enabling IP Forwarding"
echo "=========================================="

# Enable immediately
sysctl -w net.ipv4.ip_forward=1

# Persist across reboots
if grep -q "^net.ipv4.ip_forward" /etc/sysctl.conf; then
    sed -i 's/^net.ipv4.ip_forward.*/net.ipv4.ip_forward = 1/' /etc/sysctl.conf
else
    echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
fi

echo "IP forwarding enabled"

# ==============================================================================
# 3. Generate Server Keys & Config
# ==============================================================================

echo ""
echo "=========================================="
echo " 3/5  Generating Server Keys & Config"
echo "=========================================="

mkdir -p "${WG_DIR}"
chmod 700 "${WG_DIR}"

# Generate server key pair
SERVER_PRIVATE_KEY=$(wg genkey)
SERVER_PUBLIC_KEY=$(echo "${SERVER_PRIVATE_KEY}" | wg pubkey)

echo "Server public key: ${SERVER_PUBLIC_KEY}"

# Create base server config (peers will be appended below)
cat > "${WG_DIR}/${WG_INTERFACE}.conf" <<EOF
# WireGuard Server Config — Carmen Dev VPN
# Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')

[Interface]
Address = ${VPN_SERVER_IP}/24
ListenPort = ${WG_PORT}
PrivateKey = ${SERVER_PRIVATE_KEY}

# NAT masquerade — forward VPN traffic to VPC
PostUp = iptables -t nat -A POSTROUTING -s ${VPN_SUBNET} -o ${SERVER_INTERFACE} -j MASQUERADE
PostUp = iptables -A FORWARD -i ${WG_INTERFACE} -j ACCEPT
PostUp = iptables -A FORWARD -o ${WG_INTERFACE} -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -s ${VPN_SUBNET} -o ${SERVER_INTERFACE} -j MASQUERADE
PostDown = iptables -D FORWARD -i ${WG_INTERFACE} -j ACCEPT
PostDown = iptables -D FORWARD -o ${WG_INTERFACE} -j ACCEPT
EOF

echo "Server config created"

# ==============================================================================
# 4. Generate Client Keys & Configs
# ==============================================================================

echo ""
echo "=========================================="
echo " 4/5  Generating Client Keys & Configs"
echo "=========================================="

mkdir -p "${OUTPUT_DIR}"
chmod 700 "${OUTPUT_DIR}"

for i in $(seq 1 "${NUM_CLIENTS}"); do
    CLIENT_NAME="${CLIENT_PREFIX}${i}"
    CLIENT_IP="10.10.0.$((i + 1))"

    # Generate client key pair
    CLIENT_PRIVATE_KEY=$(wg genkey)
    CLIENT_PUBLIC_KEY=$(echo "${CLIENT_PRIVATE_KEY}" | wg pubkey)
    CLIENT_PRESHARED_KEY=$(wg genpsk)

    echo "  ${CLIENT_NAME}: IP=${CLIENT_IP}, PubKey=${CLIENT_PUBLIC_KEY}"

    # Append peer to server config
    cat >> "${WG_DIR}/${WG_INTERFACE}.conf" <<EOF

# ${CLIENT_NAME}
[Peer]
PublicKey = ${CLIENT_PUBLIC_KEY}
PresharedKey = ${CLIENT_PRESHARED_KEY}
AllowedIPs = ${CLIENT_IP}/32
EOF

    # Create client config file
    cat > "${OUTPUT_DIR}/client-${CLIENT_NAME}.conf" <<EOF
# WireGuard Client Config — ${CLIENT_NAME}
# Carmen Dev VPN
# Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')

[Interface]
Address = ${CLIENT_IP}/24
PrivateKey = ${CLIENT_PRIVATE_KEY}

[Peer]
PublicKey = ${SERVER_PUBLIC_KEY}
PresharedKey = ${CLIENT_PRESHARED_KEY}
Endpoint = ${SERVER_PUBLIC_IP}:${WG_PORT}
AllowedIPs = 10.10.0.0/24, ${VPC_CIDR}
PersistentKeepalive = 25
EOF

    chmod 600 "${OUTPUT_DIR}/client-${CLIENT_NAME}.conf"
done

# Lock down server config
chmod 600 "${WG_DIR}/${WG_INTERFACE}.conf"

echo "Client configs generated in ${OUTPUT_DIR}/"

# ==============================================================================
# 5. Start WireGuard
# ==============================================================================

echo ""
echo "=========================================="
echo " 5/5  Starting WireGuard"
echo "=========================================="

systemctl enable "wg-quick@${WG_INTERFACE}"
wg-quick up "${WG_INTERFACE}"

echo "WireGuard is running"
echo ""
wg show "${WG_INTERFACE}"

# ==============================================================================
# Output Summary
# ==============================================================================

echo ""
echo "=========================================="
echo " Setup Complete!"
echo "=========================================="
echo ""
echo "Server Info:"
echo "  Public IP:    ${SERVER_PUBLIC_IP}"
echo "  VPN IP:       ${VPN_SERVER_IP}"
echo "  Port:         ${WG_PORT}/UDP"
echo "  Interface:    ${WG_INTERFACE}"
echo "  Public Key:   ${SERVER_PUBLIC_KEY}"
echo ""
echo "Client Configs:"
for i in $(seq 1 "${NUM_CLIENTS}"); do
    echo "  ${CLIENT_PREFIX}${i}: ${OUTPUT_DIR}/client-${CLIENT_PREFIX}${i}.conf (IP: 10.10.0.$((i + 1)))"
done
echo ""

# ==============================================================================
# QR Codes (ถ้ามี qrencode)
# ==============================================================================

if command -v qrencode &>/dev/null; then
    echo "=========================================="
    echo " QR Codes (scan ด้วย WireGuard mobile app)"
    echo "=========================================="
    echo ""
    for i in $(seq 1 "${NUM_CLIENTS}"); do
        CLIENT_NAME="${CLIENT_PREFIX}${i}"
        echo "--- ${CLIENT_NAME} ---"
        qrencode -t ansiutf8 < "${OUTPUT_DIR}/client-${CLIENT_NAME}.conf"
        echo ""
    done
else
    echo "NOTE: ติดตั้ง qrencode เพื่อแสดง QR codes: dnf install qrencode"
    echo ""
fi

# ==============================================================================
# AWS Security Group Reminder
# ==============================================================================

echo "=========================================="
echo " AWS Security Group Rule ที่ต้องมี"
echo "=========================================="
echo ""
echo "  Type:       Custom UDP"
echo "  Port:       ${WG_PORT}"
echo "  Source:     0.0.0.0/0  (หรือจำกัดเฉพาะ IP ของ dev team)"
echo "  Description: WireGuard VPN"
echo ""
echo "  สำคัญ: ต้องปิด Source/Destination Check บน EC2 instance ด้วย"
echo ""

# ==============================================================================
# Client Setup Instructions
# ==============================================================================

echo "=========================================="
echo " วิธี Setup บนเครื่อง Dev"
echo "=========================================="
echo ""
echo "  1. Copy config file ไปเครื่อง dev:"
echo "     scp -i <key.pem> ec2-user@${SERVER_PUBLIC_IP}:${OUTPUT_DIR}/client-devN.conf ~/wg0.conf"
echo ""
echo "  2. ติดตั้ง WireGuard:"
echo "     - macOS:   brew install wireguard-tools  (หรือ WireGuard app จาก App Store)"
echo "     - Ubuntu:  sudo apt install wireguard"
echo "     - Windows: Download จาก https://www.wireguard.com/install/"
echo ""
echo "  3. เปิด VPN:"
echo "     sudo cp ~/wg0.conf /etc/wireguard/wg0.conf"
echo "     sudo wg-quick up wg0"
echo ""
echo "  4. ทดสอบ:"
echo "     curl http://10.10.0.1/realms/CARMEN_realm/.well-known/openid-configuration"
echo ""
echo "  5. ปิด VPN:"
echo "     sudo wg-quick down wg0"
echo ""
