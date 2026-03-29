# External Vault Mode Guide

Use this mode when your organization already runs Vault.

## Configure

Set in `.env`:

```env
VAULT_MODE=external
VAULT_ADDR=http://<vault-host>:8200
VAULT_TOKEN=<vault-token>
VAULT_NAMESPACE=
VAULT_KV_MOUNT=secret
VAULT_SECRET_PREFIX=eventzen
VAULT_SKIP_VERIFY=false
```

## Seed secrets externally

Write keys under:
- `secret/eventzen/shared`

Reference expected keys in [secret-schema.md](secret-schema.md).

## Start stack

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-with-vault.ps1
```

Behavior:
- Skips local `vault` and `vault-init` services.
- Pulls secrets from external Vault.
- Generates env files used by compose and local scripts.

## Security recommendation

Static tokens are supported for easy onboarding.
For stronger production posture, migrate to AppRole and short-lived tokens.
