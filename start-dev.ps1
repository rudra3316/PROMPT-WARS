# CrowdSense AI — Start All Dev Services
# PowerShell script to launch all 3 servers in separate windows

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CrowdSense AI — Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$base = $PSScriptRoot

# 1. React Admin Dashboard (Vite)
Write-Host "Starting React Admin Dashboard (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd '$base'; npm run dev"

Start-Sleep -Seconds 1

# 2. Node.js Backend Server
Write-Host "Starting Node.js Backend Server (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command cd '$base\server'; if (!(Test-Path node_modules)) { npm install }; npm start"

Start-Sleep -Seconds 2

# 3. Simulation Script
Write-Host "Starting 10k User Simulation..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit -Command cd '$base\simulation'; node simulate.js --users=3500 --interval=2000"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "  Admin Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend API:     http://localhost:3001" -ForegroundColor Cyan
Write-Host "  AI Engine:       http://localhost:8000 (start manually with Python)" -ForegroundColor Gray
Write-Host ""
Write-Host "  To start AI Engine:" -ForegroundColor Gray
Write-Host "    cd ai-engine" -ForegroundColor Gray
Write-Host "    pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "    python main.py" -ForegroundColor Gray
Write-Host ""
