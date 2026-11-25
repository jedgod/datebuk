param([string]$EnvironmentFile = ".env.production")
$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $EnvironmentFile)) { Copy-Item ".env.production.example" $EnvironmentFile }
function New-Secret([int]$Bytes = 48) {
  $buffer = New-Object byte[] $Bytes
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($buffer) } finally { $generator.Dispose() }
  return ([BitConverter]::ToString($buffer) -replace '-', '').ToLowerInvariant()
}
$values = @{
  "secrets/runtime/jwt-secret.txt" = New-Secret
  "secrets/runtime/refresh-token-pepper.txt" = New-Secret
  "secrets/turn/shared-secret.txt" = New-Secret
  "secrets/postgres/password.txt" = New-Secret 32
}
foreach ($entry in $values.GetEnumerator()) {
  $parent = Split-Path -Parent $entry.Key
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  [IO.File]::WriteAllText((Join-Path (Get-Location) $entry.Key), $entry.Value)
}
Write-Output "Generated protected runtime secret files. Do not commit or copy them into logs."
