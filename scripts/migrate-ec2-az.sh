#!/usr/bin/env bash
#
# migrate-ec2-az.sh
# ย้าย EC2 Instance ไป Availability Zone ใหม่
# - สร้าง AMI จาก Instance เดิม
# - Launch Instance ใหม่ใน AZ ปลายทาง (คัดลอก SG, IAM Role, Tags)
# - ย้าย Elastic IP ไป Instance ใหม่
#
# Usage:
#   ./migrate-ec2-az.sh <instance-id> <target-az>
#
# Example:
#   ./migrate-ec2-az.sh i-0abc123def456 ap-southeast-1b
#

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ─── Validate arguments ──────────────────────────────────────────
if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <instance-id> <target-az>"
  echo "Example: $0 i-0abc123def456 ap-southeast-1b"
  exit 1
fi

INSTANCE_ID="$1"
TARGET_AZ="$2"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# ─── Pre-flight checks ───────────────────────────────────────────
command -v aws >/dev/null 2>&1 || { err "aws CLI is not installed"; exit 1; }
command -v jq >/dev/null 2>&1 || { err "jq is not installed"; exit 1; }

log "Gathering info for instance: $INSTANCE_ID"

# ─── 1. Describe the source instance ─────────────────────────────
INSTANCE_JSON=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0]' \
  --output json)

if [[ "$INSTANCE_JSON" == "null" || -z "$INSTANCE_JSON" ]]; then
  err "Instance $INSTANCE_ID not found"
  exit 1
fi

CURRENT_AZ=$(echo "$INSTANCE_JSON" | jq -r '.Placement.AvailabilityZone')
INSTANCE_TYPE=$(echo "$INSTANCE_JSON" | jq -r '.InstanceType')
KEY_NAME=$(echo "$INSTANCE_JSON" | jq -r '.KeyName // empty')
SUBNET_ID=$(echo "$INSTANCE_JSON" | jq -r '.SubnetId')
VPC_ID=$(echo "$INSTANCE_JSON" | jq -r '.VpcId')
SG_IDS=$(echo "$INSTANCE_JSON" | jq -r '[.SecurityGroups[].GroupId] | join(",")')
IAM_PROFILE_ARN=$(echo "$INSTANCE_JSON" | jq -r '.IamInstanceProfile.Arn // empty')
INSTANCE_NAME=$(echo "$INSTANCE_JSON" | jq -r '(.Tags // [])[] | select(.Key=="Name") | .Value // empty')

log "Instance Name : ${INSTANCE_NAME:-N/A}"
log "Current AZ    : $CURRENT_AZ"
log "Target AZ     : $TARGET_AZ"
log "Instance Type : $INSTANCE_TYPE"
log "VPC           : $VPC_ID"
log "Security Groups: $SG_IDS"
log "IAM Profile   : ${IAM_PROFILE_ARN:-None}"

if [[ "$CURRENT_AZ" == "$TARGET_AZ" ]]; then
  warn "Instance is already in $TARGET_AZ. Nothing to do."
  exit 0
fi

# ─── 2. Find a subnet in the target AZ ───────────────────────────
log "Finding subnet in $TARGET_AZ within VPC $VPC_ID ..."

TARGET_SUBNET=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=availability-zone,Values=$TARGET_AZ" \
  --query 'Subnets[0].SubnetId' \
  --output text)

if [[ "$TARGET_SUBNET" == "None" || -z "$TARGET_SUBNET" ]]; then
  err "No subnet found in $TARGET_AZ for VPC $VPC_ID"
  err "Please create a subnet in $TARGET_AZ first, or specify a different AZ."
  exit 1
fi

ok "Target subnet: $TARGET_SUBNET"

# ─── 3. Check for Elastic IP ─────────────────────────────────────
log "Checking for Elastic IP ..."

EIP_JSON=$(aws ec2 describe-addresses \
  --filters "Name=instance-id,Values=$INSTANCE_ID" \
  --query 'Addresses[0]' \
  --output json 2>/dev/null || echo "null")

EIP_ALLOC_ID=""
EIP_ASSOC_ID=""
EIP_PUBLIC_IP=""

if [[ "$EIP_JSON" != "null" && -n "$EIP_JSON" ]]; then
  EIP_ALLOC_ID=$(echo "$EIP_JSON" | jq -r '.AllocationId // empty')
  EIP_ASSOC_ID=$(echo "$EIP_JSON" | jq -r '.AssociationId // empty')
  EIP_PUBLIC_IP=$(echo "$EIP_JSON" | jq -r '.PublicIp // empty')
  ok "Found Elastic IP: $EIP_PUBLIC_IP (Allocation: $EIP_ALLOC_ID)"
else
  warn "No Elastic IP found for this instance"
fi

# ─── 4. Get Tags from source instance ────────────────────────────
log "Reading tags from source instance ..."

TAGS_JSON=$(echo "$INSTANCE_JSON" | jq '[(.Tags // [])[] | select(.Key != "Name" and (.Key | startswith("aws:") | not))]')
TAG_COUNT=$(echo "$TAGS_JSON" | jq 'length')
ok "Found $TAG_COUNT tags to copy"

# ─── 5. Confirmation ─────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Migration Plan"
echo "════════════════════════════════════════════════════════"
echo "  Source Instance : $INSTANCE_ID ($INSTANCE_NAME)"
echo "  Instance Type   : $INSTANCE_TYPE"
echo "  From AZ         : $CURRENT_AZ"
echo "  To AZ           : $TARGET_AZ"
echo "  Target Subnet   : $TARGET_SUBNET"
echo "  Elastic IP      : ${EIP_PUBLIC_IP:-None}"
echo "  Tags to copy    : $TAG_COUNT"
echo "════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  1. Stop the source instance"
echo "  2. Create an AMI from it"
echo "  3. Launch a new instance in $TARGET_AZ"
echo "  4. Reassociate Elastic IP (if applicable)"
echo "  5. The source instance will NOT be terminated automatically"
echo ""
read -rp "Proceed? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
  log "Aborted by user."
  exit 0
fi

# ─── 6. Stop the source instance ─────────────────────────────────
INSTANCE_STATE=$(echo "$INSTANCE_JSON" | jq -r '.State.Name')

if [[ "$INSTANCE_STATE" == "running" ]]; then
  log "Stopping instance $INSTANCE_ID ..."
  aws ec2 stop-instances --instance-ids "$INSTANCE_ID" > /dev/null
  log "Waiting for instance to stop ..."
  aws ec2 wait instance-stopped --instance-ids "$INSTANCE_ID"
  ok "Instance stopped"
elif [[ "$INSTANCE_STATE" == "stopped" ]]; then
  ok "Instance is already stopped"
else
  err "Instance is in state '$INSTANCE_STATE'. Must be 'running' or 'stopped'."
  exit 1
fi

# ─── 7. Create AMI ───────────────────────────────────────────────
AMI_NAME="migrate-${INSTANCE_ID}-${TIMESTAMP}"

log "Creating AMI: $AMI_NAME ..."

AMI_ID=$(aws ec2 create-image \
  --instance-id "$INSTANCE_ID" \
  --name "$AMI_NAME" \
  --description "Migration AMI for $INSTANCE_ID from $CURRENT_AZ to $TARGET_AZ" \
  --no-reboot \
  --query 'ImageId' \
  --output text)

ok "AMI created: $AMI_ID"
log "Waiting for AMI to become available (this may take several minutes) ..."

aws ec2 wait image-available --image-ids "$AMI_ID"
ok "AMI is ready"

# ─── 8. Launch new instance ──────────────────────────────────────
log "Launching new instance in $TARGET_AZ ..."

RUN_ARGS=(
  --image-id "$AMI_ID"
  --instance-type "$INSTANCE_TYPE"
  --subnet-id "$TARGET_SUBNET"
  --security-group-ids ${SG_IDS//,/ }
  --placement "AvailabilityZone=$TARGET_AZ"
  --query 'Instances[0].InstanceId'
  --output text
)

if [[ -n "$KEY_NAME" ]]; then
  RUN_ARGS+=(--key-name "$KEY_NAME")
fi

if [[ -n "$IAM_PROFILE_ARN" ]]; then
  # Extract instance profile name from ARN
  IAM_PROFILE_NAME=$(echo "$IAM_PROFILE_ARN" | awk -F/ '{print $NF}')
  RUN_ARGS+=(--iam-instance-profile "Name=$IAM_PROFILE_NAME")
fi

NEW_INSTANCE_ID=$(aws ec2 run-instances "${RUN_ARGS[@]}")

ok "New instance launched: $NEW_INSTANCE_ID"

# ─── 9. Apply Tags ───────────────────────────────────────────────
log "Applying tags to new instance ..."

# Add Name tag with migration info
NAME_TAG="${INSTANCE_NAME:-$INSTANCE_ID}"
ALL_TAGS=$(echo "$TAGS_JSON" | jq --arg name "$NAME_TAG" '. + [{"Key": "Name", "Value": $name}, {"Key": "MigratedFrom", "Value": "'"$INSTANCE_ID"'"}, {"Key": "MigratedAt", "Value": "'"$TIMESTAMP"'"}]')

aws ec2 create-tags \
  --resources "$NEW_INSTANCE_ID" \
  --tags "$(echo "$ALL_TAGS" | jq -c '[.[] | {Key, Value}]')"

ok "Tags applied"

# ─── 10. Wait for new instance to be running ─────────────────────
log "Waiting for new instance to be running ..."
aws ec2 wait instance-running --instance-ids "$NEW_INSTANCE_ID"
ok "New instance is running"

# ─── 11. Reassociate Elastic IP ──────────────────────────────────
if [[ -n "$EIP_ALLOC_ID" ]]; then
  log "Reassociating Elastic IP $EIP_PUBLIC_IP to new instance ..."

  # Disassociate from old instance (if still associated)
  if [[ -n "$EIP_ASSOC_ID" ]]; then
    aws ec2 disassociate-address --association-id "$EIP_ASSOC_ID" 2>/dev/null || true
  fi

  # Associate with new instance
  NEW_ASSOC_ID=$(aws ec2 associate-address \
    --instance-id "$NEW_INSTANCE_ID" \
    --allocation-id "$EIP_ALLOC_ID" \
    --query 'AssociationId' \
    --output text)

  ok "Elastic IP $EIP_PUBLIC_IP associated to $NEW_INSTANCE_ID (Association: $NEW_ASSOC_ID)"
fi

# ─── 12. Summary ─────────────────────────────────────────────────
NEW_PRIVATE_IP=$(aws ec2 describe-instances \
  --instance-ids "$NEW_INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].PrivateIpAddress' \
  --output text)

echo ""
echo "════════════════════════════════════════════════════════"
echo -e "  ${GREEN}Migration Complete!${NC}"
echo "════════════════════════════════════════════════════════"
echo "  New Instance ID  : $NEW_INSTANCE_ID"
echo "  Availability Zone: $TARGET_AZ"
echo "  Private IP       : $NEW_PRIVATE_IP"
echo "  Public IP (EIP)  : ${EIP_PUBLIC_IP:-N/A}"
echo "  AMI Used         : $AMI_ID"
echo ""
echo "  Old Instance     : $INSTANCE_ID (stopped, NOT terminated)"
echo "════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Verify the new instance is working correctly"
echo "  2. Once verified, terminate the old instance:"
echo "     aws ec2 terminate-instances --instance-ids $INSTANCE_ID"
echo "  3. (Optional) Deregister the migration AMI:"
echo "     aws ec2 deregister-image --image-id $AMI_ID"
echo ""
