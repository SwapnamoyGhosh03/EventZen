# Vault Troubleshooting

## Vault container unhealthy

Symptoms:
- `docker compose --profile vault-dev up -d vault vault-init` fails.

Checks:
1. `docker compose --profile vault-dev logs vault --tail 100`
2. Ensure port in `.env` is not blocked: `HOST_VAULT_PORT`.
3. Re-run port resolver:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Resolve-UnreservedPorts.ps1 -EnvFilePath .env`

## Missing required configuration errors on Node services

Symptoms:
- Startup throws `Missing required configuration: ...`

Cause:
- Secrets were not rendered from Vault or required keys are missing from Vault path.

Fix:
1. Confirm `VAULT_TOKEN` is set.
2. Confirm secret exists at `secret/eventzen/shared` (or configured mount/prefix).
3. Re-render:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\vault\Render-VaultEnv.ps1 -Target both -EnvFilePath .env`

## External Vault mode fails

Checks:
1. `VAULT_MODE=external` in `.env`.
2. `VAULT_ADDR` and `VAULT_TOKEN` are valid.
3. If using Enterprise namespace, set `VAULT_NAMESPACE`.
4. Verify KV mount/prefix:
   - `VAULT_KV_MOUNT`
   - `VAULT_SECRET_PREFIX`

## vault-init completed but renderer fails

Checks:
1. Inspect seeding logs:
   - `docker compose --profile vault-dev logs vault-init --tail 100`
2. Ensure path is `secret/eventzen/shared` unless overridden.
3. Re-run vault-init:
   - `docker compose --profile vault-dev up -d --force-recreate vault-init`

## Generated env files are missing

Files expected:
- `.vault/generated/common.env`
- `.vault/generated/local.env`

Fix:
1. Run renderer manually.
2. Confirm script exits with code 0.
3. Ensure `.vault/generated` directory exists and is writable.
