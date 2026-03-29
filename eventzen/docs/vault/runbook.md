# EventZen Vault Runbook

This runbook supports two modes:
- Dev mode: local Vault container with automatic seeding.
- External mode: connect to an existing Vault instance.

## 1) One-command Dev Mode (recommended for third-party users)

From repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\eventzen\scripts\bootstrap-with-vault.ps1
```

From eventzen folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-with-vault.ps1
```

What it does:
1. Resolves unreserved host ports.
2. Starts `vault` and `vault-init` (`vault-dev` profile).
3. Pulls secrets from Vault and renders:
   - `.vault/generated/common.env`
   - `.vault/generated/local.env`
4. Starts full compose stack.

## 2) Local (non-Docker services) with Vault-backed secrets

```bat
cd eventzen
start-all.bat
```

The batch script now:
1. Starts Vault in dev mode when `VAULT_MODE=dev`.
2. Renders `.vault/generated/local.env`.
3. Exports rendered env vars and starts services.

## 3) Docker mode with external Vault

Set in `.env`:

```env
VAULT_MODE=external
VAULT_ADDR=http://<vault-host>:8200
VAULT_TOKEN=<token>
VAULT_KV_MOUNT=secret
VAULT_SECRET_PREFIX=eventzen
```

Then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-with-vault.ps1
```

In external mode, local Vault containers are skipped.

## 4) Required secret schema

See [secret-schema.md](secret-schema.md).

## 5) Quick validation

```powershell
docker compose config --quiet
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\vault\Render-VaultEnv.ps1 -Target both -EnvFilePath ".env"
Get-Content .\.vault\generated\common.env | Select-Object -First 12
```
