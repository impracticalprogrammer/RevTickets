# Restart frontend to apply cache-busting fix
Write-Host "=== Restarting Frontend ===" -ForegroundColor Yellow

docker-compose down frontend
docker rmi revtickets-frontend -f
docker-compose build frontend
docker-compose up -d

Write-Host "`n=== Waiting for frontend to start ===" -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n=== Frontend Status ===" -ForegroundColor Green
docker logs nextjs-frontend --tail 10

Write-Host "`n=== IMPORTANT ===" -ForegroundColor Cyan
Write-Host "1. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "2. Or use Incognito mode (Ctrl+Shift+N)" -ForegroundColor White
Write-Host "3. Then test the ticket again" -ForegroundColor White


