param(
  [string]$EnvFilePath = ".env"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFilePath)) {
  throw "Env file not found: $EnvFilePath"
}

function Get-ListeningPorts {
  try {
    return @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Select-Object -ExpandProperty LocalPort -Unique)
  } catch {
    $ports = @()
    $lines = netstat -ano -p tcp
    foreach ($line in $lines) {
      if ($line -match "^\s*TCP\s+[^:]+:(\d+)\s+\S+\s+LISTENING") {
        $ports += [int]$Matches[1]
      }
    }
    return @($ports | Sort-Object -Unique)
  }
}

function Get-ExcludedTcpRanges {
  $ranges = @()
  $lines = netsh interface ipv4 show excludedportrange protocol=tcp
  foreach ($line in $lines) {
    if ($line -match "^\s*(\d+)\s+(\d+)\s*$") {
      $start = [int]$Matches[1]
      $end = [int]$Matches[2]
      $ranges += [pscustomobject]@{ Start = $start; End = $end }
    }
  }
  return $ranges
}

function Test-PortFree {
  param(
    [int]$Port,
    [hashtable]$UsedPorts,
    [array]$ExcludedRanges
  )

  if ($Port -lt 1024 -or $Port -gt 65535) {
    return $false
  }

  if ($UsedPorts.ContainsKey($Port)) {
    return $false
  }

  foreach ($r in $ExcludedRanges) {
    if ($Port -ge $r.Start -and $Port -le $r.End) {
      return $false
    }
  }

  return $true
}

function Find-NextFreePort {
  param(
    [int]$StartPort,
    [hashtable]$UsedPorts,
    [array]$ExcludedRanges
  )

  for ($p = $StartPort; $p -le 65535; $p++) {
    if (Test-PortFree -Port $p -UsedPorts $UsedPorts -ExcludedRanges $ExcludedRanges) {
      return $p
    }
  }

  throw "No free port found from $StartPort to 65535"
}

function Get-EnvValue {
  param(
    [string[]]$Lines,
    [string]$Key
  )

  foreach ($line in $Lines) {
    if ($line -match "^\s*$([Regex]::Escape($Key))=(.*)$") {
      return $Matches[1].Trim()
    }
  }
  return $null
}

function Set-EnvValue {
  param(
    [string[]]$Lines,
    [string]$Key,
    [string]$Value
  )

  $pattern = "^\s*$([Regex]::Escape($Key))="
  $updated = $false

  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i] -match $pattern) {
      $Lines[$i] = "$Key=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $Lines += "$Key=$Value"
  }

  return ,$Lines
}

$portVars = [ordered]@{
  "HOST_FRONTEND_PORT" = 5173
  "HOST_KONG_PROXY_PORT" = 8080
  "HOST_KONG_SSL_PORT" = 8443
  "HOST_AUTH_SERVICE_PORT" = 8081
  "HOST_EVENT_SERVICE_PORT" = 8082
  "HOST_VENUE_VENDOR_SERVICE_PORT" = 8083
  "HOST_TICKETING_SERVICE_PORT" = 8084
  "HOST_FINANCE_SERVICE_PORT" = 8085
  "HOST_NOTIFICATION_SERVICE_PORT" = 8086
  "HOST_MYSQL_AUTH_PORT" = 3306
  "HOST_MYSQL_EVENTS_PORT" = 3307
  "HOST_MYSQL_FINANCE_PORT" = 3308
  "HOST_MONGO_VENUE_PORT" = 27017
  "HOST_MONGO_TICKETING_PORT" = 27018
  "HOST_MONGO_NOTIFICATION_PORT" = 27019
  "HOST_REDIS_PORT" = 6379
  "HOST_ZOOKEEPER_PORT" = 2181
  "HOST_KAFKA_PORT" = 9092
  "HOST_MINIO_API_PORT" = 9000
  "HOST_MINIO_CONSOLE_PORT" = 9001
  "HOST_ELASTICSEARCH_PORT" = 9200
}

$lines = Get-Content -LiteralPath $EnvFilePath
$listeningPorts = Get-ListeningPorts
$excludedRanges = Get-ExcludedTcpRanges

$used = @{}
foreach ($p in $listeningPorts) {
  $used[[int]$p] = $true
}

$resolved = @()
foreach ($entry in $portVars.GetEnumerator()) {
  $key = $entry.Key
  $defaultPort = [int]$entry.Value

  $rawCurrent = Get-EnvValue -Lines $lines -Key $key
  $candidate = $defaultPort
  if ($rawCurrent -and $rawCurrent -match "^\d+$") {
    $candidate = [int]$rawCurrent
  }

  $selectedPort = Find-NextFreePort -StartPort $candidate -UsedPorts $used -ExcludedRanges $excludedRanges
  $used[$selectedPort] = $true

  $lines = Set-EnvValue -Lines $lines -Key $key -Value "$selectedPort"

  $resolved += [pscustomobject]@{
    Variable = $key
    Port = $selectedPort
  }
}

Set-Content -LiteralPath $EnvFilePath -Value $lines -Encoding utf8

Write-Host "Updated $EnvFilePath with unreserved host ports:" -ForegroundColor Green
$resolved | Format-Table -AutoSize

$envDir = Split-Path -Parent (Resolve-Path -LiteralPath $EnvFilePath)
$frontendEnvPath = Join-Path $envDir "frontend/.env"
$frontendLines = @(
  "VITE_AUTH_API_URL=http://localhost:$((($resolved | Where-Object Variable -eq 'HOST_AUTH_SERVICE_PORT').Port))/api/v1",
  "VITE_EVENT_API_URL=http://localhost:$((($resolved | Where-Object Variable -eq 'HOST_EVENT_SERVICE_PORT').Port))/api/v1",
  "VITE_VENUE_API_URL=http://localhost:$((($resolved | Where-Object Variable -eq 'HOST_VENUE_VENDOR_SERVICE_PORT').Port))/api/v1",
  "VITE_TICKET_API_URL=http://localhost:$((($resolved | Where-Object Variable -eq 'HOST_TICKETING_SERVICE_PORT').Port))/api/v1",
  "VITE_PAYMENT_API_URL=http://localhost:$((($resolved | Where-Object Variable -eq 'HOST_FINANCE_SERVICE_PORT').Port))/api/v1",
  "VITE_NOTIFICATION_API_URL=http://localhost:$((($resolved | Where-Object Variable -eq 'HOST_NOTIFICATION_SERVICE_PORT').Port))/api/v1",
  "VITE_UPLOAD_URL=http://localhost:$((($resolved | Where-Object Variable -eq 'HOST_VENUE_VENDOR_SERVICE_PORT').Port))/api/v1/upload"
)

Set-Content -LiteralPath $frontendEnvPath -Value $frontendLines -Encoding utf8
Write-Host "Updated frontend env: $frontendEnvPath" -ForegroundColor Green
