using Microsoft.EntityFrameworkCore;
using Requests.Application.Requests;
using Requests.Domain.Entities;
using Requests.Infrastructure.Persistence;

namespace Requests.Infrastructure.Repositories;

public sealed class RequestRepository : IRequestRepository
{
    private readonly RequestsDbContext _db;

    public RequestRepository(RequestsDbContext db) => _db = db;

    public Task<List<Request>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _db.Requests.ToListAsync(cancellationToken);
    }
    public async Task<PagedResult<RequestDto>> SearchAsync(
        SearchRequestBody req, int userId, bool isAdmin, CancellationToken ct = default)
    {
        var query = _db.Requests.AsNoTracking();

        // הרשאות: משתמש רגיל רואה רק בקשות שבבעלותו או מוקצות אליו
        if (!isAdmin)
            query = query.Where(r => r.OwnerId == userId || r.AssignedToUserId == userId);

        // חיפוש חלקי במספר בקשה
        if (!string.IsNullOrWhiteSpace(req.RequestNumber))
        {
            var pattern = $"%{EscapeLikePattern(req.RequestNumber)}%";
            query = query.Where(r => EF.Functions.Like(r.RequestNumber, pattern, "\\"));
        }

        // סינון לפי סטטוסים - המרה ל-enum values
        var statusesList = req.GetStatusesList();
        if (statusesList.Count > 0)
        {
            var statusEnums = statusesList
                .Select(s => Enum.TryParse<RequestStatus>(s, true, out var status) ? status : (RequestStatus?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
            
            if (statusEnums.Count > 0)
                query = query.Where(r => statusEnums.Contains(r.Status));
        }

        // סינון לפי סוג בקשה
        if (!string.IsNullOrWhiteSpace(req.RequestType))
        {
            if (Enum.TryParse<RequestType>(req.RequestType, true, out var requestType))
                query = query.Where(r => r.RequestType == requestType);
        }

        // טווח תאריכי יצירה
        if (req.CreatedFrom.HasValue)
            query = query.Where(r => r.CreatedAt >= req.CreatedFrom.Value.Date);

        if (req.CreatedTo.HasValue)
            query = query.Where(r => r.CreatedAt < req.CreatedTo.Value.Date.AddDays(1));

        var total = await query.CountAsync(ct);

        query = ApplySort(query, req.SortBy, req.SortDir);

        var pageSize = req.PageSize == -1 ? int.MaxValue : req.PageSize;
        var items = await query
            .Skip((req.Page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RequestDto(r.Id, r.RequestNumber, r.CustomerId, r.OwnerId,
                r.AssignedToUserId, r.Status, r.RequestType, r.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<RequestDto>
        {
            Items = items,
            Page = req.Page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    private static IQueryable<Request> ApplySort(IQueryable<Request> query, string sortBy, string sortDir)
    {
        var desc = sortDir.Equals("desc", StringComparison.OrdinalIgnoreCase);

        return sortBy.ToLowerInvariant() switch
        {
            "id" => desc ? query.OrderByDescending(r => r.Id) : query.OrderBy(r => r.Id),
            "requestnumber" => desc ? query.OrderByDescending(r => r.RequestNumber) : query.OrderBy(r => r.RequestNumber),
            "status" => desc ? query.OrderByDescending(r => r.Status) : query.OrderBy(r => r.Status),
            "requesttype" => desc ? query.OrderByDescending(r => r.RequestType) : query.OrderBy(r => r.RequestType),
            _ => desc ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt)
        };
    }

    private static string EscapeLikePattern(string value) =>
        value.Trim()
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");
}
