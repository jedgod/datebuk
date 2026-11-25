param(
    [int[]]$Ports = @(3001, 3002, 4000),
    [switch]$Detailed
)

$ErrorActionPreference = "Stop"

$routesByPort = @{
    3001 = @("/admin/login", "/api/auth/login")
    3002 = @("/staff-login", "/api/auth/staff-login")
    4000 = @("/", "/auth/login")
}

function Get-PortOwner {
    param([int]$Port)

    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $conn) {
        return @{ pid = $null; name = "-" }
    }

    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    $procName = "unknown"
    if ($proc -and $proc.ProcessName) {
        $procName = $proc.ProcessName
    }

    return @{ pid = $conn.OwningProcess; name = $procName }
}

function Test-Route {
    param(
        [int]$Port,
        [string]$Path
    )

    $url = "http://localhost:$Port$Path"
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 5
        return @{ status = [int]$response.StatusCode; ok = $true; error = ""; url = $url }
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        return @{
            status = $statusCode
            ok     = $false
            error  = $_.Exception.Message
            url    = $url
        }
    }
}

$results = @()

foreach ($port in $Ports) {
    $owner = Get-PortOwner -Port $port
    $routes = $routesByPort[$port]
    if (-not $routes) {
        $routes = @("/")
    }

    foreach ($route in $routes) {
        $probe = Test-Route -Port $port -Path $route
        $results += [pscustomobject]@{
            Port    = $port
            Process = if ($owner.pid) { "$($owner.name) ($($owner.pid))" } else { "not-listening" }
            Route   = $route
            Status  = if ($probe.status) { $probe.status } else { "no-response" }
            Healthy = if ($probe.ok -or $probe.status) { "yes" } else { "no" }
            Url     = $probe.url
            Error   = if ($Detailed) { $probe.error } else { "" }
        }
    }
}

$results | Format-Table -AutoSize

if ($Detailed) {
    Write-Host "\nDetailed probe output complete."
}
