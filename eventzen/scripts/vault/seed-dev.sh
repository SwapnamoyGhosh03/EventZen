#!/bin/sh
set -eu

export VAULT_ADDR="${VAULT_ADDR_INTERNAL:-http://vault:8200}"
export VAULT_TOKEN="${VAULT_DEV_ROOT_TOKEN:-eventzen-dev-root}"
export VAULT_SKIP_VERIFY="true"

until vault status >/dev/null 2>&1; do
  echo "Waiting for Vault at ${VAULT_ADDR} ..."
  sleep 1
done

if ! vault secrets list -format=json | grep -q '"secret/"'; then
  vault secrets enable -path=secret kv-v2
fi

vault kv put secret/eventzen/shared \
  MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-changeme-root}" \
  AUTH_DB_PASSWORD="${AUTH_DB_PASSWORD:-auth_pass_2026}" \
  EVENT_DB_PASSWORD="${EVENT_DB_PASSWORD:-event_pass_2026}" \
  FINANCE_DB_PASSWORD="${FINANCE_DB_PASSWORD:-finance_pass_2026}" \
  REDIS_PASSWORD="${REDIS_PASSWORD:-eventzen_redis_2026}" \
  JWT_SECRET="${JWT_SECRET:-eventzen-super-secret-key-change-in-production-2026}" \
  JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-eventzen-refresh-secret-key-change-in-production-2026}" \
  TICKET_HMAC_SECRET="${TICKET_HMAC_SECRET:-eventzen-ticket-hmac-secret-2026}" \
  PII_ENCRYPTION_KEY="${PII_ENCRYPTION_KEY:-0123456789abcdef0123456789abcdef}" \
  STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_placeholder}" \
  STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_placeholder}" \
  SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}" \
  SMTP_PORT="${SMTP_PORT:-587}" \
  SMTP_USER="${SMTP_USER:-}" \
  SMTP_PASS="${SMTP_PASS:-}" \
  SMTP_FROM="${SMTP_FROM:-EventZen <noreply@eventzen.com>}" \
  SENDGRID_API_KEY="${SENDGRID_API_KEY:-SG.placeholder}" \
  TWILIO_SID="${TWILIO_SID:-AC_placeholder}" \
  TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-placeholder}" \
  TWILIO_PHONE="${TWILIO_PHONE:-+10000000000}" \
  FCM_PROJECT_ID="${FCM_PROJECT_ID:-}" \
  FCM_PRIVATE_KEY="${FCM_PRIVATE_KEY:-}" \
  FCM_CLIENT_EMAIL="${FCM_CLIENT_EMAIL:-}" \
  MINIO_ROOT_USER="${MINIO_ROOT_USER:-eventzen}" \
  MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-eventzen123}" \
  MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-eventzen}" \
  MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-eventzen123}"

echo "Seeded Vault KV at secret/eventzen/shared"
