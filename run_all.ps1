# Run all services for CEP DC Distributed System
Write-Host "Starting all services concurrently..." -ForegroundColor Cyan

# Ensure dependencies are installed in root (for concurrently)
if (!(Test-Path "node_modules")) {
    Write-Host "Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

# Run the dev command
npm run dev
