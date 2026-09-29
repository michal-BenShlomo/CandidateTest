# Candidate Test – Requests Search &amp; Filter

## 1. What was implemented

**Part A – Feature (Backend + Frontend)**
- `GET /api/requests/search` endpoint: partial `RequestNumber` search, multi-value
  `Status` filter, `RequestType` filter, created-date range, sorting (whitelisted
  fields, asc/desc), pagination.
- All filtering/sorting/paging is translated to a single EF Core `IQueryable` and
  executed at the database, not in memory - required to scale to millions of rows
  (see [Requests.Infrastructure/Repositories/RequestRepository.cs](src/Requests.Infrastructure/Repositories/RequestRepository.cs)).
- Server-side enforced permissions: a non-administrator's ownership/assignment
  restriction (`OwnerId`/`AssignedToUserId` = current user) is added to the same
  `WHERE` clause used for search - it is never applied only client-side or as a
  post-filter, so pagination/counts stay correct and it cannot be bypassed by page
  or sort parameters.
- Input validation collects all errors (bad enum values, invalid date range,
  invalid `page`/`pageSize`, unknown sort field) and returns `400 Bad Request` with
  a structured error list, instead of throwing unhandled exceptions.
- React (JSX) frontend: filter form (request number, status checkboxes, type,
  date range), sortable table headers, pagination, and Loading / Error / Empty
  states.
- Unit tests for the service (permissions, filters, validation, paging) and
  repository-level tests against a real EF Core `DbContext` (InMemory provider) to
  confirm the LINQ actually executes, not just compiles.

**Part B – Architecture**
- See [ARCHITECTURE.md](ARCHITECTURE.md): proposed microservice decomposition and a
  detailed reliable-notification design (Transactional Outbox + message broker +
  idempotent consumer + DLQ) for the "Notification Service may be down" scenario.

## 2. How to run

### Backend (.NET 8 / ASP.NET Core / EF Core)

```powershell
dotnet run --project src/Requests.Api/Requests.Api.csproj
```

The API listens on `http://localhost:60702` (see [src/Requests.Api/Properties/launchSettings.json](src/Requests.Api/Properties/launchSettings.json)).
Swagger UI is available at `/swagger` in Development.
The database is EF Core **InMemory** and is seeded with 500 requests on startup
(unchanged from the original repo) - no setup/migrations needed.

Example request:

```powershell
Invoke-RestMethod -Uri "http://localhost:60702/api/requests/search?statuses=1&statuses=2&sortBy=createdAt&sortDirection=desc&page=1&pageSize=20" `
  -Headers @{ "X-User-Id" = "1"; "X-Is-Admin" = "false" }
```

### Frontend (React + Vite, JSX)

```powershell
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` and calls the API at `http://localhost:60702`
(configurable via `VITE_API_BASE_URL` env var). The backend has a CORS policy that
explicitly allows `http://localhost:5173` (see [src/Requests.Api/Program.cs](src/Requests.Api/Program.cs)).

There is no real login: use the **"Viewing as"** dropdown in the top-right of the
UI to simulate a regular user (owner/assignee-restricted) or an Administrator (sees
everything) - this matches the exercise's header-based "auth"
(`X-User-Id` / `X-Is-Admin`).

### Tests

```powershell
dotnet test tests/Requests.Tests/Requests.Tests.csproj
```

16 tests covering: admin vs. regular-user visibility, partial request-number
search, multi-status filter, date-range filter, pagination + total count
correctness, and validation failures (bad page/pageSize, bad date range, invalid
status value, invalid sort field). A couple of tests also exercise the real EF
Core `RequestRepository` (InMemory provider) to make sure the query translates and
executes correctly, not just that the C# compiles.

## 3. Technologies chosen and why

- **Backend: kept the existing .NET 8 / ASP.NET Core / EF Core stack** (not
  switched to another language). The existing clean-architecture layering
  (Domain/Application/Infrastructure/Api) was already in place and is a good fit
  for adding a query/filter layer without touching the API surface's shape more
  than necessary.
- **Frontend: React with plain JSX** (no TypeScript), scaffolded with Vite. Chosen
  over Angular for faster setup and lower ceremony for a small, single-page
  search screen; JSX (rather than TSX) per the requested variant of the exercise.
- **Database: kept EF Core InMemory provider** (as in the original repo) rather
  than switching to SQLite/SQL Server. See tradeoff discussion below.

## 4. Assumptions

- The `X-User-Id` / `X-Is-Admin` header-based "authentication" from the original
  repo is intentional for the exercise and was kept as-is (in a real system this
  would be replaced by a JWT/claims-based identity).
- "Millions of records" is a target for the **query design** (must not load the
  full table into memory, must filter/sort/page at the database), not something
  that needs to be physically seeded/tested in this exercise environment.
- Sortable fields are limited to a fixed whitelist (`requestNumber`, `status`,
  `requestType`, `createdAt`) rather than accepting an arbitrary client-supplied
  field name, both for safety and because that whitelist is what makes sense to
  show as sortable columns in the UI.
- Date filters are treated as `CreatedAt >= from` and `CreatedAt <= to` (inclusive
  on both ends).

## 5. One technical decision with real tradeoffs

**Decision: kept the EF Core InMemory database provider instead of moving to
SQLite/SQL Server.**

- **Why keep it:** zero setup for whoever reviews this (no local SQL Server, no
  connection strings, no migrations to run) and it was already wired up in the
  starter repo, in line with "prefer a simple, well-reasoned solution over
  unnecessary complexity."
- **Tradeoff / what we give up:** the InMemory provider does **not** faithfully
  represent a real relational engine - it doesn't build real indexes, doesn't
  reflect real `LIKE`/`Contains` query-plan cost, and doesn't validate that
  generated SQL is actually valid/efficient on a real engine. For "millions of
  rows" performance, this matters: the query *shape* (pure `IQueryable`,
  server-side `Where`/`OrderBy`/`Skip`/`Take`, no client-side evaluation) is
  correct and is what would translate to efficient SQL on a real database, but the
  actual index tuning (e.g. a composite index on `(OwnerId, AssignedToUserId)`, an
  index on `CreatedAt`, and depending on the engine, a full-text/trigram index for
  `RequestNumber Contains(...)` instead of a plain B-tree, which doesn't accelerate
  leading-wildcard `LIKE '%x%'`) could only be verified/tuned against a real
  engine such as SQL Server or PostgreSQL.
- **How I'd continue:** swap `UseInMemoryDatabase(...)` for
  `UseSqlite(...)`/`UseSqlServer(...)` in [DependencyInjection.cs](src/Requests.Infrastructure/DependencyInjection.cs),
  add an EF Core migration, add the indexes mentioned above, and re-run the
  repository tests (they already run against a real `DbContext`, so most of them
  would keep working unchanged) plus a basic load test with a few million seeded
  rows to validate query plans (`EXPLAIN`/execution plan) actually use the
  indexes.

## 6. What I did not have time to finish / how I'd continue

- **Frontend automated tests** (e.g. React Testing Library for `SearchFilters`,
  `RequestsTable`, and the debounced search hook) were not added given the time
  budget - backend testing was prioritized since permission enforcement and query
  correctness are the higher-risk areas. I'd add component tests for: rendering
  loading/error/empty states, and that toggling a status checkbox updates the
  request payload.
- **Real database + migrations** were not swapped in (see tradeoff above) - the
  query layer is designed to translate correctly, but hasn't been validated
  against real query plans/indexes on millions of rows.
- **Real authentication** (JWT/OIDC) was out of scope - the header-based user
  simulation from the original repo was kept and exposed via a "Viewing as"
  dropdown in the UI for demo purposes only.
- **Part B was kept as a design document** (diagram + written explanation) rather
  than an actual running Outbox/broker implementation, given the time budget - if
  continued, the next step would be a small proof-of-concept: an `OutboxMessages`
  table + background `IHostedService` publisher in the Requests Service, and a
  minimal consumer using a local broker (e.g. RabbitMQ via Docker) to demonstrate
  the idempotent-consumer/DLQ behavior end-to-end.
