# Design Document - חיפוש וסינון בקשות

## סקירת הפתרון

### Backend
- **Endpoint**: `POST /api/requests/search`
- **טכנולוגיה**: .NET 8, ASP.NET Core Web API, Entity Framework Core
- **ארכיטקטורה**: Clean Architecture (Api → Application → Infrastructure → Domain)

### Frontend
- **טכנולוגיה**: React + Material-UI
- **שפה**: עברית (RTL)

---

## Backend Architecture

```
RequestsController (Api Layer)
         │
         ▼
   IRequestService (Application Layer)
         │
         ▼
  IRequestRepository (Application Layer - Interface)
         │
         ▼
  RequestRepository (Infrastructure Layer)
         │
         ▼
   RequestsDbContext (EF Core)
         │
         ▼
      Database
```

### מודלים

**SearchRequestBody** - גוף הבקשה:
```csharp
public class SearchRequestBody
{
    public string? RequestNumber { get; set; }     // חיפוש חלקי
    public List<string>? Statuses { get; set; }    // סינון סטטוסים
    public string? RequestType { get; set; }        // סינון סוג
    public DateTime? CreatedFrom { get; set; }      // מתאריך
    public DateTime? CreatedTo { get; set; }        // עד תאריך
    public string SortBy { get; set; } = "createdAt";
    public string SortDir { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}
```

**PagedResult<T>** - תגובה עם Pagination:
```csharp
public sealed record PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
```

### Repository - לוגיקת סינון

```csharp
public async Task<PagedResult<RequestDto>> SearchAsync(
    SearchRequestBody req, int userId, bool isAdmin, CancellationToken ct)
{
    var query = _db.Requests.AsNoTracking();

    // הרשאות (REQ-7, REQ-8, REQ-9)
    if (!isAdmin)
        query = query.Where(r => r.OwnerId == userId || r.AssignedToUserId == userId);

    // חיפוש חלקי (REQ-1)
    if (!string.IsNullOrWhiteSpace(req.RequestNumber))
        query = query.Where(r => EF.Functions.Like(r.RequestNumber, $"%{escaped}%"));

    // סינון סטטוסים (REQ-2)
    if (req.Statuses?.Count > 0)
        query = query.Where(r => req.Statuses.Contains(r.Status.ToString()));

    // סינון סוג (REQ-4)
    if (!string.IsNullOrWhiteSpace(req.RequestType))
        query = query.Where(r => r.RequestType.ToString() == req.RequestType);

    // טווח תאריכים (REQ-3)
    if (req.CreatedFrom.HasValue)
        query = query.Where(r => r.CreatedAt >= req.CreatedFrom.Value.Date);
    if (req.CreatedTo.HasValue)
        query = query.Where(r => r.CreatedAt < req.CreatedTo.Value.Date.AddDays(1));

    // ביצועים (REQ-10) - COUNT + SELECT ברמת DB
    var total = await query.CountAsync(ct);
    query = ApplySort(query, req.SortBy, req.SortDir);  // (REQ-5)
    var items = await query.Skip(...).Take(...).Select(...).ToListAsync(ct);

    return new PagedResult<RequestDto> { ... };
}
```

---

## Frontend Architecture

```
App.jsx (State Management)
    │
    ├── UserContextPanel.jsx  (הגדרת משתמש לבדיקות)
    ├── FilterPanel.jsx       (טופס סינון - REQ-11)
    ├── ErrorMessage.jsx      (חיווי שגיאה - REQ-15)
    ├── RequestTable.jsx      (טבלת תוצאות - REQ-13, REQ-12, REQ-16)
    └── Pagination.jsx        (ניווט דפים)
```

### API Service

```javascript
export async function searchRequests(params, userContext) {
    return fetch('/api/requests/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userContext.userId,
            'X-Is-Admin': userContext.isAdmin
        },
        body: JSON.stringify(body)
    });
}
```

---

## החלטות עיצוביות

1. **POST במקום GET** - מאפשר גמישות עבור מערך סטטוסים
2. **Material-UI** - ספרייה מוכרת עם תמיכה ב-RTL
3. **כפתור "סנן"** - המשתמש שולט מתי לבצע חיפוש
4. **Pagination קבוע למטה** - נגיש תמיד למשתמש
