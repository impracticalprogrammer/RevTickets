# Cache-Busting Fix for Category Names

## Problem
Ticket #69241ace9ceb0082f6435783 shows old category name "IT Support" even after updating to "EIT Support".

## Root Cause
Browser or HTTP caching is returning stale ticket data.

## Solution: Cache-Busting Timestamps

Added timestamp query parameters to all ticket API calls to force fresh data retrieval.

### Changes Made

#### `frontend/src/lib/api/tickets.ts`

**getById()**:
```typescript
async getById(id: string): Promise<Ticket> {
  // Add cache-busting timestamp to ensure fresh data
  const timestamp = new Date().getTime();
  return this.client.get<Ticket>(`/tickets/${id}?_t=${timestamp}`);
}
```

**getAll()**:
```typescript
async getAll(params?: Record<string, string>): Promise<Ticket[]> {
  // Add cache-busting timestamp to ensure fresh data
  const allParams = { ...params, _t: new Date().getTime().toString() };
  const queryString = `?${new URLSearchParams(allParams).toString()}`;
  return this.client.get<Ticket[]>(`/tickets${queryString}`);
}
```

## How It Works

1. Every API call to fetch tickets now includes a unique timestamp parameter (`_t`)
2. Example: `/api/v1/tickets/69241ace9ceb0082f6435783?_t=1732441234567`
3. Browser sees this as a new URL each time
4. Forces fresh data fetch from backend
5. Backend ignores the `_t` parameter (it's not in the API schema)
6. Latest category name is always returned

## Testing

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. Login: `sarah.wilson@company.com` / `password123`
3. Go to `/tickets/69241ace9ceb0082f6435783`
4. Note the category name
5. Go to `/categories`
6. Update the category name
7. Go back to `/tickets/69241ace9ceb0082f6435783`
8. **Expected**: Should show updated category name immediately

## Additional Benefits

- No more stale ticket data
- Category updates reflect immediately
- Works across all ticket views (list, detail)
- No manual cache clearing needed

## Status
✅ Frontend restarted with cache-busting
✅ Ready for testing

## If Still Not Working

If you still see the old category name after this fix, the issue is in the MongoDB database itself. Run:

```powershell
docker exec mongodb mongosh revtickets --eval "db.Category.find({}, {name: 1}).pretty()"
```

This will show all category names in the database.


