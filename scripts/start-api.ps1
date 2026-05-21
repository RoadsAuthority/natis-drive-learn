# Free port 3001 if something is stuck, then start the NaTIS API.
$port = 3001
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($conn in $connections) {
  Write-Host "Stopping process $($conn.OwningProcess) on port $port..."
  Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1
Set-Location $PSScriptRoot\..
Write-Host "Starting API (Ctrl+C to stop)..."
npm run dev:api
