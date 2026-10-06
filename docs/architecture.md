# תרשים ארכיטקטורה - מערכת ניהול בקשות

## סקירה כללית

המערכת בנויה לפי עקרונות **Clean Architecture** עם הפרדה ברורה בין שכבות, 
וכוללת Frontend ב-React ו-Backend ב-ASP.NET Core 8.

---

## תרשים ארכיטקטורה ראשי

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              🖥️  CLIENT LAYER                               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         React Frontend                                │  │
│  │                         (localhost:3000)                              │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ FilterPanel │ │RequestTable │ │ Pagination  │ │UserContextPanel │  │  │
│  │  │   (סינון)   │ │  (טבלה)     │ │   (דפדוף)   │ │  (בדיקת הרשאות) │  │  │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────────┬────────┘  │  │
│  │         │               │               │                 │           │  │
│  │         └───────────────┴───────────────┴─────────────────┘           │  │
│  │                                 │                                     │  │
│  │                          ┌──────▼──────┐                              │  │
│  │                          │   App.jsx   │                              │  │
│  │                          │ (Orchestrator)                             │  │
│  │                          └──────┬──────┘                              │  │
│  │                                 │                                     │  │
│  │                          ┌──────▼──────┐                              │  │
│  │                          │ apiService  │                              │  │
│  │                          │ (HTTP Client)                              │  │
│  │                          └──────┬──────┘                              │  │
│  └─────────────────────────────────┼─────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                         HTTP GET /api/requests
                         Headers: X-User-Id, X-Is-Admin
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🌐 BACKEND (ASP.NET Core 8)                       │
│                              (localhost:60701)                              │
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                        API LAYER (Requests.Api)                       ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    RequestsController                           │  ║  │
│  ║  │  • GET /api/requests - חיפוש וסינון עם pagination               │  ║  │
│  ║  │  • Query Parameters: requestNumber, statuses[], requestType,    │  ║  │
│  ║  │    createdFrom, createdTo, sortBy, sortDir, page, pageSize      │  ║  │
│  ║  │  • Validation: סטטוסים, סוגי בקשה, טווח תאריכים                  │  ║  │
│  ║  └──────────────────────────────┬──────────────────────────────────┘  ║  │
│  ╚═════════════════════════════════╪═════════════════════════════════════╝  │
│                                    │                                        │
│                                    │ IRequestService                        │
│                                    ▼                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                 APPLICATION LAYER (Requests.Application)              ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                      RequestService                             │  ║  │
│  ║  │  • Business logic orchestration                                 │  ║  │
│  ║  │  • DTO transformations                                          │  ║  │
│  ║  └──────────────────────────────┬──────────────────────────────────┘  ║  │
│  ║                                 │                                     ║  │
│  ║  ┌──────────────┐  ┌───────────────────┐  ┌────────────────────────┐  ║  │
│  ║  │ FilterModels │  │ PagedResult<T>    │  │   RequestDto           │  ║  │
│  ║  │  • SearchRequestBody              │  │  • Id, RequestNumber   │  ║  │
│  ║  │  • statuses, requestType          │  │  • Status, Type, Date  │  ║  │
│  ║  │  • date range, sort, pagination   │  │  • OwnerId, Description│  ║  │
│  ║  └──────────────┘  └───────────────────┘  └────────────────────────┘  ║  │
│  ║                                                                       ║  │
│  ║                    Interfaces (Contracts):                            ║  │
│  ║                    ├── IRequestService                                ║  │
│  ║                    └── IRequestRepository                             ║  │
│  ╚═════════════════════════════════╪═════════════════════════════════════╝  │
│                                    │                                        │
│                                    │ IRequestRepository                     │
│                                    ▼                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║               INFRASTRUCTURE LAYER (Requests.Infrastructure)          ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    RequestRepository                            │  ║  │
│  ║  │  • LINQ-based filtering                                         │  ║  │
│  ║  │  • Permission filtering (Admin vs User)                         │  ║  │
│  ║  │  • Dynamic sorting                                              │  ║  │
│  ║  │  • Server-side pagination                                       │  ║  │
│  ║  │  • LIKE search with escape (SQL injection protection)           │  ║  │
│  ║  └──────────────────────────────┬──────────────────────────────────┘  ║  │
│  ║                                 │                                     ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                   RequestsDbContext                             │  ║  │
│  ║  │  • Entity Framework Core                                        │  ║  │
│  ║  │  • In-Memory Database                                           │  ║  │
│  ║  │  • DbSet<Request>                                               │  ║  │
│  ║  └──────────────────────────────┬──────────────────────────────────┘  ║  │
│  ║                                 │                                     ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                      DbSeeder                                   │  ║  │
│  ║  │  • Seed initial test data                                       │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                    DOMAIN LAYER (Requests.Domain)                     ║  │
│  ║  ┌────────────────────┐  ┌────────────────┐  ┌────────────────────┐   ║  │
│  ║  │      Request       │  │ RequestStatus  │  │   RequestType      │   ║  │
│  ║  │  (Entity)          │  │   (Enum)       │  │     (Enum)         │   ║  │
│  ║  │  • Id              │  │  • New         │  │  • General         │   ║  │
│  ║  │  • RequestNumber   │  │  • InProgress  │  │  • Urgent          │   ║  │
│  ║  │  • Status          │  │  • Completed   │  │  • Internal        │   ║  │
│  ║  │  • RequestType     │  │  • Cancelled   │  │                    │   ║  │
│  ║  │  • OwnerId         │  │                │  │                    │   ║  │
│  ║  │  • CreatedAt       │  │                │  │                    │   ║  │
│  ║  │  • Description     │  │                │  │                    │   ║  │
│  ║  └────────────────────┘  └────────────────┘  └────────────────────┘   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## תרשים זרימת נתונים - חיפוש בקשות

```
┌──────────┐         ┌───────────┐         ┌────────────┐         ┌────────────┐         ┌─────────┐
│  User    │         │  Frontend │         │    API     │         │ Application│         │ Database│
│ (Browser)│         │  (React)  │         │ (Controller)         │ (Service)  │         │(EF Core)│
└────┬─────┘         └─────┬─────┘         └──────┬─────┘         └──────┬─────┘         └────┬────┘
     │                     │                      │                      │                    │
     │ 1. הזנת פילטרים    │                      │                      │                    │
     │ ולחיצה על "סנן"    │                      │                      │                    │
     │────────────────────>│                      │                      │                    │
     │                     │                      │                      │                    │
     │                     │ 2. GET /api/requests │                      │                    │
     │                     │    ?status=New       │                      │                    │
     │                     │    &page=1           │                      │                    │
     │                     │    Headers:          │                      │                    │
     │                     │    X-User-Id: 5      │                      │                    │
     │                     │    X-Is-Admin: false │                      │                    │
     │                     │─────────────────────>│                      │                    │
     │                     │                      │                      │                    │
     │                     │                      │ 3. Validate params   │                    │
     │                     │                      │    Extract headers   │                    │
     │                     │                      │    Build SearchBody  │                    │
     │                     │                      │                      │                    │
     │                     │                      │ 4. SearchAsync()     │                    │
     │                     │                      │─────────────────────>│                    │
     │                     │                      │                      │                    │
     │                     │                      │                      │ 5. Apply filters   │
     │                     │                      │                      │    (LINQ)          │
     │                     │                      │                      │───────────────────>│
     │                     │                      │                      │                    │
     │                     │                      │                      │    6. Filtered     │
     │                     │                      │                      │       results      │
     │                     │                      │                      │<───────────────────│
     │                     │                      │                      │                    │
     │                     │                      │ 7. PagedResult<DTO>  │                    │
     │                     │                      │<─────────────────────│                    │
     │                     │                      │                      │                    │
     │                     │ 8. JSON Response     │                      │                    │
     │                     │    {items, totalCount│                      │                    │
     │                     │     page, pageSize}  │                      │                    │
     │                     │<─────────────────────│                      │                    │
     │                     │                      │                      │                    │
     │ 9. עדכון טבלה      │                      │                      │                    │
     │    ו-pagination     │                      │                      │                    │
     │<────────────────────│                      │                      │                    │
     │                     │                      │                      │                    │
```

---

## תרשים מבנה קומפוננטות Frontend

```
                            ┌─────────────────────────────────┐
                            │            App.jsx              │
                            │  ┌───────────────────────────┐  │
                            │  │ State:                    │  │
                            │  │ • requests[]              │  │
                            │  │ • filters{}               │  │
                            │  │ • pagination{}            │  │
                            │  │ • loading, error          │  │
                            │  │ • userId, isAdmin         │  │
                            │  └───────────────────────────┘  │
                            └────────────────┬────────────────┘
                                             │
               ┌──────────────┬──────────────┼──────────────┬──────────────┐
               │              │              │              │              │
               ▼              ▼              ▼              ▼              ▼
    ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ UserContextPanel │ │ FilterPanel  │ │ RequestTable │ │  Pagination  │ │ ErrorMessage │
    │                  │ │              │ │              │ │              │ │              │
    │ Props:           │ │ Props:       │ │ Props:       │ │ Props:       │ │ Props:       │
    │ • userId         │ │ • onSearch   │ │ • requests   │ │ • page       │ │ • message    │
    │ • isAdmin        │ │ • loading    │ │ • loading    │ │ • totalPages │ │              │
    │ • onUserChange   │ │              │ │              │ │ • onPageChange│              │
    │ • onAdminChange  │ │ Features:    │ │ Features:    │ │              │ │ Features:    │
    │                  │ │ • מספר בקשה  │ │ • Sortable   │ │ Features:    │ │ • Snackbar   │
    │ Features:        │ │ • סטטוסים    │ │ • Colored    │ │ • Page nav   │ │ • Auto-hide  │
    │ • Debug panel    │ │ • סוג בקשה   │ │   status     │ │ • Page size  │ └──────────────┘
    │ • User switching │ │ • טווח תאריכים│ │   chips     │ │   selector   │
    │ • Admin toggle   │ │ • כפתור סינון│ │ • RTL       │ │              │
    └──────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## תרשים שכבות - Clean Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    │              EXTERNAL SYSTEMS               │
                    │                                             │
                    │    ┌─────────────┐      ┌─────────────┐    │
                    │    │   React     │      │  Swagger    │    │
                    │    │   Frontend  │      │  UI         │    │
                    │    └──────┬──────┘      └──────┬──────┘    │
                    │           │                    │           │
                    └───────────┼────────────────────┼───────────┘
                                │                    │
                                ▼                    ▼
    ┌───────────────────────────────────────────────────────────────────────┐
    │                                                                       │
    │                         API LAYER (Outer)                             │
    │                                                                       │
    │   ┌───────────────────────────────────────────────────────────────┐   │
    │   │                    Requests.Api                               │   │
    │   │                                                               │   │
    │   │  • Controllers (HTTP endpoints)                               │   │
    │   │  • Input validation                                           │   │
    │   │  • HTTP status codes                                          │   │
    │   │  • Request/Response formatting                                │   │
    │   └───────────────────────────────────────────────────────────────┘   │
    │                                  │                                    │
    └──────────────────────────────────┼────────────────────────────────────┘
                                       │ Depends on ↓
    ┌──────────────────────────────────┼────────────────────────────────────┐
    │                                  ▼                                    │
    │                      APPLICATION LAYER (Middle)                       │
    │                                                                       │
    │   ┌───────────────────────────────────────────────────────────────┐   │
    │   │                  Requests.Application                         │   │
    │   │                                                               │   │
    │   │  • Service interfaces (IRequestService)                       │   │
    │   │  • Repository interfaces (IRequestRepository)                 │   │
    │   │  • DTOs (RequestDto, SearchRequestBody, PagedResult)          │   │
    │   │  • Business logic coordination                                │   │
    │   └───────────────────────────────────────────────────────────────┘   │
    │                                  │                                    │
    └──────────────────────────────────┼────────────────────────────────────┘
                                       │ Depends on ↓
    ┌──────────────────────────────────┼────────────────────────────────────┐
    │                                  ▼                                    │
    │                       DOMAIN LAYER (Core)                             │
    │                                                                       │
    │   ┌───────────────────────────────────────────────────────────────┐   │
    │   │                   Requests.Domain                             │   │
    │   │                                                               │   │
    │   │  • Entities (Request)                                         │   │
    │   │  • Enums (RequestStatus, RequestType)                         │   │
    │   │  • Domain rules (if any)                                      │   │
    │   │  • NO external dependencies                                   │   │
    │   └───────────────────────────────────────────────────────────────┘   │
    │                                                                       │
    └───────────────────────────────────────────────────────────────────────┘

                                       ▲ Implements interfaces from Application
    ┌──────────────────────────────────┼────────────────────────────────────┐
    │                                  │                                    │
    │                   INFRASTRUCTURE LAYER (Outer)                        │
    │                                                                       │
    │   ┌───────────────────────────────────────────────────────────────┐   │
    │   │                 Requests.Infrastructure                       │   │
    │   │                                                               │   │
    │   │  • Repository implementations                                 │   │
    │   │  • DbContext (EF Core)                                        │   │
    │   │  • Database configuration                                     │   │
    │   │  • Data seeding                                               │   │
    │   │  • Dependency Injection setup                                 │   │
    │   └───────────────────────────────────────────────────────────────┘   │
    │                                  │                                    │
    │                                  ▼                                    │
    │                         ┌─────────────────┐                           │
    │                         │   In-Memory DB  │                           │
    │                         │   (EF Core)     │                           │
    │                         └─────────────────┘                           │
    │                                                                       │
    └───────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Injection Flow

```
Program.cs
    │
    ├── AddControllers()
    ├── AddSwaggerGen()
    └── AddInfrastructure()  ──────────────────────────────┐
                                                           │
                                                           ▼
                                            DependencyInjection.cs
                                                           │
                                    ┌──────────────────────┼──────────────────────┐
                                    │                      │                      │
                                    ▼                      ▼                      ▼
                          AddDbContext()          AddScoped<>()          AddScoped<>()
                                │                      │                      │
                                ▼                      ▼                      ▼
                       RequestsDbContext      IRequestRepository     IRequestService
                       (In-Memory DB)                │                      │
                                                     ▼                      ▼
                                            RequestRepository        RequestService
```

---

## מאפייני אבטחה והרשאות

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PERMISSION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   HTTP Request                                                              │
│   ┌─────────────────────────────────────────┐                               │
│   │ Headers:                                │                               │
│   │   X-User-Id: 5                          │                               │
│   │   X-Is-Admin: false                     │                               │
│   └──────────────────┬──────────────────────┘                               │
│                      │                                                      │
│                      ▼                                                      │
│   ┌─────────────────────────────────────────┐                               │
│   │ Controller: Extract & Pass              │                               │
│   │   userId = headers["X-User-Id"]         │                               │
│   │   isAdmin = headers["X-Is-Admin"]       │                               │
│   └──────────────────┬──────────────────────┘                               │
│                      │                                                      │
│                      ▼                                                      │
│   ┌─────────────────────────────────────────┐                               │
│   │ Repository: Filter by Permission        │                               │
│   │                                         │                               │
│   │   if (isAdmin)                          │                               │
│   │     return ALL requests                 │                               │
│   │   else                                  │                               │
│   │     return WHERE OwnerId == userId      │                               │
│   └─────────────────────────────────────────┘                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⚠️  הערה: במערכת אמיתית - לא לסמוך על Headers מהקליינט!                   │
│      יש להשתמש באימות Token-based (JWT) ולבצע Authorization בשרת.           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## סיכום טכנולוגיות

| שכבה | טכנולוגיה | תפקיד |
|------|-----------|-------|
| **Frontend** | React 18, Material UI, Webpack | ממשק משתמש RTL |
| **API** | ASP.NET Core 8 | Web API, Validation |
| **Application** | C# Classes | Business Logic, DTOs |
| **Domain** | C# Entities | Domain Model |
| **Infrastructure** | EF Core, In-Memory DB | Data Access |

---

## קבצים עיקריים

| קובץ | שכבה | תפקיד |
|------|------|-------|
| `App.jsx` | Frontend | Main orchestrator |
| `FilterPanel.jsx` | Frontend | טופס סינון |
| `RequestTable.jsx` | Frontend | טבלת תוצאות |
| `apiService.js` | Frontend | HTTP client |
| `RequestsController.cs` | API | HTTP endpoints |
| `RequestService.cs` | Application | Business logic |
| `RequestRepository.cs` | Infrastructure | Data access |
| `Request.cs` | Domain | Entity model |
