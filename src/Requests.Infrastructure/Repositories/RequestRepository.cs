using Microsoft.EntityFrameworkCore;
using Requests.Application.Requests;
using Requests.Domain.Entities;
using Requests.Infrastructure.Persistence;

namespace Requests.Infrastructure.Repositories;

public sealed class RequestRepository : IRequestRepository
{
    private readonly RequestsDbContext _db;

    public RequestRepository(RequestsDbContext db)
    {
        _db = db;
    }

    public Task<List<Request>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _db.Requests.ToListAsync(cancellationToken);
    }

    public async Task<(List<Request> Items, int TotalCount)> SearchAsync(
        RequestSearchFilter filter,
        CancellationToken cancellationToken = default)
    {
        // Everything below is expressed as an IQueryable so EF Core translates
        // it into a single SQL query (WHERE/ORDER BY/OFFSET-FETCH). Only one
        // page of rows is ever materialized, which is what allows this to
        // scale to millions of rows instead of loading the whole table.
        IQueryable<Request> query = _db.Requests.AsNoTracking();

        if (filter.RestrictToUserId is int restrictedUserId)
        {
            query = query.Where(r =>
                r.OwnerId == restrictedUserId || r.AssignedToUserId == restrictedUserId);
        }

        if (!string.IsNullOrWhiteSpace(filter.RequestNumber))
        {
            query = query.Where(r => r.RequestNumber.Contains(filter.RequestNumber));
        }

        if (filter.Statuses is { Count: > 0 } statuses)
        {
            query = query.Where(r => statuses.Contains(r.Status));
        }

        if (filter.RequestType is RequestType requestType)
        {
            query = query.Where(r => r.RequestType == requestType);
        }

        if (filter.CreatedFrom is DateTime from)
        {
            query = query.Where(r => r.CreatedAt >= from);
        }

        if (filter.CreatedTo is DateTime to)
        {
            query = query.Where(r => r.CreatedAt <= to);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySort(query, filter.SortBy, filter.SortDirection);

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    private static IQueryable<Request> ApplySort(
        IQueryable<Request> query,
        RequestSortField sortBy,
        SortDirection direction)
    {
        var ascending = direction == SortDirection.Ascending;

        return sortBy switch
        {
            RequestSortField.RequestNumber => ascending
                ? query.OrderBy(r => r.RequestNumber)
                : query.OrderByDescending(r => r.RequestNumber),
            RequestSortField.Status => ascending
                ? query.OrderBy(r => r.Status)
                : query.OrderByDescending(r => r.Status),
            RequestSortField.RequestType => ascending
                ? query.OrderBy(r => r.RequestType)
                : query.OrderByDescending(r => r.RequestType),
            // Secondary sort by Id keeps paging stable across pages when
            // many rows share the same CreatedAt value.
            _ => ascending
                ? query.OrderBy(r => r.CreatedAt).ThenBy(r => r.Id)
                : query.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id)
        };
    }
}
