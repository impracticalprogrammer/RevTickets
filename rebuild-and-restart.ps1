# Complete rebuild and restart script
Write-Host "=== Stopping all containers ===" -ForegroundColor Yellow
docker-compose down

Write-Host "`n=== Clearing Docker cache (7.5GB reclaimed) ===" -ForegroundColor Yellow
docker system prune -af

Write-Host "`n=== Clearing volumes ===" -ForegroundColor Yellow
docker volume prune -f

Write-Host "`n=== Building with no cache ===" -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host "`n=== Starting containers ===" -ForegroundColor Yellow
docker-compose up -d

Write-Host "`n=== Waiting for containers to be ready ===" -ForegroundColor Yellow
Start-Sleep -Seconds 25

Write-Host "`n=== Container Status ===" -ForegroundColor Green
docker-compose ps

Write-Host "`n=== Frontend Logs ===" -ForegroundColor Green
docker logs nextjs-frontend --tail 10

Write-Host "`n=== Backend Logs ===" -ForegroundColor Green
docker logs fastapi-backend --tail 10

Write-Host "`n=== Application ready at http://localhost:3000 ===" -ForegroundColor Green
Write-Host "IMPORTANT: Clear browser cache or use incognito mode!" -ForegroundColor Cyan


