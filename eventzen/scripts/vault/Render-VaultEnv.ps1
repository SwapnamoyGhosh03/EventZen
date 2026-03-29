param(
  [ValidateSet('docker', 'local', 'both')]
  [string]$Target = 'both',
  [string]$EnvFilePath = '.env'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-EnvFile {
  param([string]$Path)
  $map = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $map
  }

  foreach ($line in (Get-Content -LiteralPath $Path)) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line.Trim().StartsWith('#')) { continue }
    $pair = $line -split '=', 2
    if ($pair.Count -ne 2) { continue }
    $map[$pair[0].Trim()] = $pair[1]
  }

  return $map
}

function Resolve-ConfigValue {
  param(
    [hashtable]$FileValues,
    [string]$Key,
    [string]$Default = ''
  )

  $envValue = [Environment]::GetEnvironmentVariable($Key)
  if (-not [string]::IsNullOrWhiteSpace($envValue)) {
    return $envValue
  }

  if ($FileValues.ContainsKey($Key) -and -not [string]::IsNullOrWhiteSpace($FileValues[$Key])) {
    return $FileValues[$Key]
  }

  return $Default
}

function Write-DotEnv {
  param(
    [string]$Path,
    [hashtable]$Values,
    [string[]]$Order
  )

  $lines = @()
  foreach ($key in $Order) {
    if (-not $Values.ContainsKey($key)) { continue }
    $value = [string]$Values[$key]
    $normalized = $value -replace "`r", '' -replace "`n", '\n'
    $lines += "$key=$normalized"
  }

  Set-Content -LiteralPath $Path -Value $lines -Encoding utf8
}

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$envPath = Join-Path $rootDir $EnvFilePath
$fileValues = Read-EnvFile -Path $envPath

$vaultMode = Resolve-ConfigValue -FileValues $fileValues -Key 'VAULT_MODE' -Default 'dev'
$vaultAddr = Resolve-ConfigValue -FileValues $fileValues -Key 'VAULT_ADDR' -Default 'http://127.0.0.1:8200'
$vaultToken = Resolve-ConfigValue -FileValues $fileValues -Key 'VAULT_TOKEN' -Default ''
$vaultNamespace = Resolve-ConfigValue -FileValues $fileValues -Key 'VAULT_NAMESPACE' -Default ''
$vaultKvMount = Resolve-ConfigValue -FileValues $fileValues -Key 'VAULT_KV_MOUNT' -Default 'secret'
$vaultSecretPrefix = Resolve-ConfigValue -FileValues $fileValues -Key 'VAULT_SECRET_PREFIX' -Default 'eventzen'
$vaultSkipVerify = (Resolve-ConfigValue -FileValues $fileValues -Key 'VAULT_SKIP_VERIFY' -Default 'false').ToLowerInvariant()

if ($vaultAddr.ToLowerInvariant().StartsWith('https://') -and $vaultSkipVerify -eq 'true') {
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
  [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
}

if ([string]::IsNullOrWhiteSpace($vaultToken)) {
  throw 'VAULT_TOKEN is required. Set it in .env or current shell environment.'
}

$headers = @{ 'X-Vault-Token' = $vaultToken }
if (-not [string]::IsNullOrWhiteSpace($vaultNamespace)) {
  $headers['X-Vault-Namespace'] = $vaultNamespace
}

$secretUriV2 = "{0}/v1/{1}/data/{2}/shared" -f $vaultAddr.TrimEnd('/'), $vaultKvMount, $vaultSecretPrefix
$secretUriV1 = "{0}/v1/{1}/{2}/shared" -f $vaultAddr.TrimEnd('/'), $vaultKvMount, $vaultSecretPrefix

$vaultData = $null

if ($vaultMode -eq 'dev') {
  Push-Location $rootDir
  try {
    $vaultPath = "$vaultKvMount/$vaultSecretPrefix/shared"
    $devJsonLines = docker compose --profile vault-dev exec -T vault sh -c "export VAULT_ADDR=http://127.0.0.1:8200; export VAULT_TOKEN=$vaultToken; vault kv get -format=json $vaultPath"
    $devJson = ($devJsonLines -join "`n")
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($devJson)) {
      $parsed = $devJson | ConvertFrom-Json
      if ($parsed.data -and $parsed.data.data) {
        $vaultData = $parsed.data.data
      }
    }
  } catch {
    # Fall back to HTTP API if docker exec retrieval fails.
  } finally {
    Pop-Location
  }
}

if (-not $vaultData) {
  try {
    $resp = Invoke-RestMethod -Method Get -Uri $secretUriV2 -Headers $headers -TimeoutSec 20
    if ($resp.data -and $resp.data.data) {
      $vaultData = $resp.data.data
    }
  } catch {
    # Fallback to KV v1 if KV v2 path is unavailable.
  }
}

if (-not $vaultData) {
  try {
    $resp = Invoke-RestMethod -Method Get -Uri $secretUriV1 -Headers $headers -TimeoutSec 20
    if ($resp.data) {
      $vaultData = $resp.data
    }
  } catch {
    throw "Failed to read Vault secret at $secretUriV2 and $secretUriV1. Mode=$vaultMode. $($_.Exception.Message)"
  }
}

if (-not $vaultData) {
  throw "Vault response does not contain KV data at $secretUriV2 or $secretUriV1"
}

$orderedKeys = @(
  'MYSQL_ROOT_PASSWORD',
  'AUTH_DB_PASSWORD',
  'EVENT_DB_PASSWORD',
  'FINANCE_DB_PASSWORD',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'TICKET_HMAC_SECRET',
  'PII_ENCRYPTION_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'SENDGRID_API_KEY',
  'TWILIO_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE',
  'FCM_PROJECT_ID',
  'FCM_PRIVATE_KEY',
  'FCM_CLIENT_EMAIL',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY'
)

$requiredKeys = @(
  'MYSQL_ROOT_PASSWORD',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'TICKET_HMAC_SECRET'
)

$resolved = @{}
foreach ($key in $orderedKeys) {
  if ($vaultData.PSObject.Properties.Name -contains $key -and -not [string]::IsNullOrWhiteSpace([string]$vaultData.$key)) {
    $resolved[$key] = [string]$vaultData.$key
  } elseif ($fileValues.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace($fileValues[$key])) {
    $resolved[$key] = $fileValues[$key]
  }
}

$missing = @()
foreach ($k in $requiredKeys) {
  if (-not $resolved.ContainsKey($k) -or [string]::IsNullOrWhiteSpace([string]$resolved[$k])) {
    $missing += $k
  }
}

if ($missing.Count -gt 0) {
  throw "Missing required secrets from Vault/.env fallback: $($missing -join ', ')"
}

$outDir = Join-Path $rootDir '.vault\generated'
if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

if ($Target -eq 'docker' -or $Target -eq 'both') {
  Write-DotEnv -Path (Join-Path $outDir 'common.env') -Values $resolved -Order $orderedKeys
  Write-Host 'Generated .vault/generated/common.env' -ForegroundColor Green
}

if ($Target -eq 'local' -or $Target -eq 'both') {
  Write-DotEnv -Path (Join-Path $outDir 'local.env') -Values $resolved -Order $orderedKeys
  Write-Host 'Generated .vault/generated/local.env' -ForegroundColor Green
}
