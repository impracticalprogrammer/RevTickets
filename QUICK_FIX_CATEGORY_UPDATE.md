# Quick Fix for Category Update Issue

## The Problem
PowerShell is trying to activate a Python virtual environment, but you don't need it for Docker commands.

## Solution: Run These Commands Directly

Open a **NEW PowerShell window** and run these commands **one by one**:

```powershell
cd C:\Users\E191630\SKI-VIBE-FOLDER\RevTickets

docker-compose down frontend

docker rmi revtickets-frontend -f

docker-compose build frontend

docker-compose up -d
```

Wait for the build to complete (about 2-3 minutes), then:

```powershell
docker logs nextjs-frontend --tail 10
```

You should see:
```
✓ Ready in XXXms
```

## Then Test

1. **Clear browser cache**: Ctrl+Shift+Delete → Select "Cached images and files" → Clear data
2. **Or use Incognito mode**: Ctrl+Shift+N
3. Login: `sarah.wilson@company.com` / `password123`
4. Go to `/tickets/69241ace9ceb0082f6435783`
5. **Check if category name shows the updated value**

## What the Fix Does

The code change adds a cache-busting timestamp to every ticket API call:
- Before: `/api/v1/tickets/69241ace9ceb0082f6435783`
- After: `/api/v1/tickets/69241ace9ceb0082f6435783?_t=1732441234567`

This forces the browser to fetch fresh data every time, ensuring you always see the latest category names.

## If You Still See Old Name

If after clearing cache and rebuilding you STILL see "IT Support" instead of the updated name, then the issue is in the MongoDB database itself - the category wasn't actually updated. In that case, we need to check the database directly.

## Alternative: Bypass PowerShell Execution Policy

If you want to run the script file, you can bypass the execution policy:

```powershell
powershell -ExecutionPolicy Bypass -File restart-frontend-fix.ps1
```

But it's simpler to just run the Docker commands directly as shown above.


