# Test script to verify category update is working

Write-Host "=== Testing Category Update ===" -ForegroundColor Yellow

# Login
Write-Host "`n1. Logging in..." -ForegroundColor Cyan
$loginBody = "username=sarah.wilson@company.com&password=password123"
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/login" -Method POST -Body $loginBody -ContentType "application/x-www-form-urlencoded"
$token = $loginResponse.access_token
Write-Host "   Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green

# Get categories
Write-Host "`n2. Fetching categories..." -ForegroundColor Cyan
$headers = @{"Authorization" = "Bearer $token"}
$categories = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/categories" -Method GET -Headers $headers
Write-Host "   Found $($categories.Count) categories" -ForegroundColor Green
$categories | ForEach-Object { Write-Host "   - $($_.name) (ID: $($_.id))" }

# Get the specific ticket
Write-Host "`n3. Fetching ticket #69241ace9ceb0082f6435783..." -ForegroundColor Cyan
try {
    $ticket = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets/69241ace9ceb0082f6435783" -Method GET -Headers $headers
    Write-Host "   Ticket Title: $($ticket.title)" -ForegroundColor Green
    Write-Host "   Category: $($ticket.category.name) (ID: $($ticket.category.id))" -ForegroundColor Green
    Write-Host "   SubCategory: $($ticket.subCategory.name)" -ForegroundColor Green
} catch {
    Write-Host "   Error fetching ticket: $_" -ForegroundColor Red
}

# Get all tickets
Write-Host "`n4. Fetching all tickets..." -ForegroundColor Cyan
$tickets = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets" -Method GET -Headers $headers
Write-Host "   Found $($tickets.Count) tickets" -ForegroundColor Green
$tickets | Select-Object -First 5 | ForEach-Object { 
    Write-Host "   - Ticket #$($_.id): Category = $($_.category.name)" 
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Yellow
Write-Host "If the category name is still showing as 'IT Support' above, the issue is in the backend." -ForegroundColor Cyan
Write-Host "If it shows the new name, the issue is frontend caching." -ForegroundColor Cyan


