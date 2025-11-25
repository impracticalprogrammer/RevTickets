# Category Update Not Showing - Debug Guide

## Issue
Ticket #69241ace9ceb0082f6435783 still shows old category name "IT Support" instead of updated name.

## Possible Causes

### 1. Frontend Browser Cache
The browser may be caching the old ticket data.

**Test**: 
- Clear browser cache (Ctrl+Shift+Delete)
- Or use Incognito mode (Ctrl+Shift+N)
- Navigate to the ticket again

### 2. Frontend Component Not Refetching
The TicketsList or TicketDetail component may not be refetching after category update.

**Test**:
1. Open browser console (F12)
2. Go to `/categories`, update a category
3. Look for console log: `[TicketsList] Category updated, refetching tickets...`
4. If you don't see this, the event isn't firing

### 3. Backend Not Fetching Latest Category
The backend Link.fetch() may not be getting the latest data.

**Test**:
```powershell
# Check what the backend API actually returns
$headers = @{"Authorization" = "Bearer YOUR_TOKEN_HERE"}
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets/69241ace9ceb0082f6435783" -Method GET -Headers $headers | ConvertTo-Json -Depth 5
```

### 4. MongoDB Not Updated
The category document in MongoDB may not have been updated.

**Test**:
```powershell
# Connect to MongoDB and check
docker exec -it mongodb mongosh
use revtickets
db.Category.find({name: /Support/})
```

## Quick Fix Steps

### Step 1: Force Frontend Refresh
```javascript
// In browser console on /tickets page
localStorage.clear()
location.reload()
```

### Step 2: Manually Trigger Refetch
```javascript
// In browser console on /tickets page
window.dispatchEvent(new CustomEvent('categoryUpdated'))
```

### Step 3: Check Backend Response
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/tickets/69241ace9ceb0082f6435783`
4. Find the API request to `/api/v1/tickets/69241ace9ceb0082f6435783`
5. Check the Response tab - what category name does it show?

## Current Implementation

### Backend (`ticket_service.py` line 22)
```python
category = await ticket.category_id.fetch() if ticket.category_id else None
```
This SHOULD fetch the latest category data from MongoDB.

### Frontend Event System
```typescript
// CategoriesList dispatches event after update
window.dispatchEvent(new CustomEvent('categoryUpdated', { 
  detail: { categoryId: editingCategory.id } 
}));

// TicketsList listens and refetches
window.addEventListener('categoryUpdated', handleCategoryUpdate);
```

## What to Check Now

1. **Clear your browser cache completely**
2. **Login fresh**
3. **Go to `/categories`**
4. **Update "IT Support" to "EIT Support"**
5. **Open browser console and check for**: `[TicketsList] Category updated, refetching tickets...`
6. **Go to `/tickets`** - does it show the new name?
7. **Go to `/tickets/69241ace9ceb0082f6435783`** - does it show the new name?

If after clearing cache it STILL shows old name, then the issue is in the backend fetch logic.

## Next Steps

Please try:
1. Clear browser cache (Ctrl+Shift+Delete → "Cached images and files")
2. Close and reopen browser
3. Login again
4. Check the ticket

If it still shows old name, we need to investigate the MongoDB data directly.


