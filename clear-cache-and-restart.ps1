#!/usr/bin/env pwsh
# Clear all caches and restart the entire application

Write-Host "=== Clearing Caches and Restarting Application ===" -ForegroundColor Cyan

# Step 1: Stop all containers
Write-Host "`n[1/5] Stopping all containers..." -ForegroundColor Yellow
docker-compose down

# Step 2: Clear Docker build cache
Write-Host "`n[2/5] Clearing Docker build cache..." -ForegroundColor Yellow
docker builder prune -f

# Step 3: Remove unused containers, networks, images
Write-Host "`n[3/5] Cleaning up unused Docker resources..." -ForegroundColor Yellow
docker system prune -f

# Step 4: Rebuild all containers without cache
Write-Host "`n[4/5] Rebuilding all containers (this may take a while)..." -ForegroundColor Yellow
docker-compose build --no-cache

# Step 5: Start all services
Write-Host "`n[5/5] Starting all services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to start
Write-Host "`nWaiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check container status
Write-Host "`n=== Container Status ===" -ForegroundColor Cyan
docker-compose ps

Write-Host "`n=== Application Restart Complete ===" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White

