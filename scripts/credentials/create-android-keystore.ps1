param(
  [string]$Keystore = "secrets/android/datebuk-release.keystore",
  [string]$Alias = "datebuk",
  [string]$PasswordFile = "secrets/android/keystore-password.txt"
)
$ErrorActionPreference = "Stop"
if (Test-Path -LiteralPath $Keystore) { throw "Keystore already exists: $Keystore" }
function New-Secret([int]$Bytes = 32) {
  $buffer = New-Object byte[] $Bytes
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($buffer) } finally { $generator.Dispose() }
  return ([BitConverter]::ToString($buffer) -replace '-', '').ToLowerInvariant()
}
$parent = Split-Path -Parent $Keystore
New-Item -ItemType Directory -Force -Path $parent | Out-Null
$password = if (Test-Path -LiteralPath $PasswordFile) { (Get-Content -LiteralPath $PasswordFile -Raw).Trim() } else { New-Secret }
[IO.File]::WriteAllText((Join-Path (Get-Location) $PasswordFile), $password)
[IO.File]::WriteAllText((Join-Path (Get-Location) "secrets/android/key-password.txt"), $password)
& keytool -genkeypair -v -storetype PKCS12 -keystore $Keystore -storepass $password -keypass $password -alias $Alias -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=DateBuk Mobile, OU=Release, O=DateBuk, L=Unknown, ST=Unknown, C=US" -noprompt
if ($LASTEXITCODE -ne 0) { throw "keytool failed" }
Write-Output "Created $Keystore with protected password files. Back up all three files securely."
