param(
  [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$envPath = Join-Path $rootDir '.env'
$resolvePortsScript = Join-Path $rootDir 'scripts\Resolve-UnreservedPorts.ps1'
$renderScript = Join-Path $rootDir 'scripts\vault\Render-VaultEnv.ps1'

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Missing .env at $envPath"
}

& $resolvePortsScript -EnvFilePath $envPath
if ($LASTEXITCODE -ne 0) {
  throw 'Port resolution failed.'
}

$envMap = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
  if ([string]::IsNullOrWhiteSpace($line) -or $line.Trim().StartsWith('#')) { continue }
  $pair = $line -split '=', 2
  if ($pair.Count -eq 2) {
    $envMap[$pair[0].Trim()] = $pair[1]
  }
}

$vaultMode = if ($envMap.ContainsKey('VAULT_MODE') -and -not [string]::IsNullOrWhiteSpace($envMap['VAULT_MODE'])) { $envMap['VAULT_MODE'] } else { 'dev' }
$vaultMode = $vaultMode.ToLowerInvariant()

Push-Location $rootDir
try {
  if ($vaultMode -eq 'dev') {
    Write-Host 'Starting local dev Vault profile...' -ForegroundColor Cyan
    & docker compose --profile vault-dev up -d vault vault-init
    if ($LASTEXITCODE -ne 0) {
      throw 'Failed to start vault and vault-init services.'
    }
  } else {
    Write-Host 'VAULT_MODE=external, skipping local Vault startup.' -ForegroundColor Yellow
  }

  & $renderScript -Target both -EnvFilePath '.env'
  if ($LASTEXITCODE -ne 0) {
    throw 'Vault env render failed.'
  }

  if (-not $SkipBuild) {
    if ($vaultMode -eq 'dev') {
      & docker compose --profile vault-dev up -d --build
    } else {
      & docker compose up -d --build
    }
  } else {
    if ($vaultMode -eq 'dev') {
      & docker compose --profile vault-dev up -d
    } else {
      & docker compose up -d
    }
  }

  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose up failed.'
  }

  Write-Host 'EventZen stack is up with Vault-backed env injection.' -ForegroundColor Green
}
finally {
  Pop-Location
}
