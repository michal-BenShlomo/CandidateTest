using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public enum RequestSortField
{
    RequestNumber,
    Status,
    RequestType,
    CreatedAt
}

public enum SortDirection
{
    Ascending,
    Descending
}

/// <summary>
/// Validated, strongly-typed filter used by the repository to build the
/// EF Core query. <see cref="RestrictToUserId"/> carries the server-side
/// enforced ownership restriction for non-administrator users; it is set by
/// the service and is never trusted from client input.
/// </summary>
public sealed record RequestSearchFilter(
    string? RequestNumber,
    IReadOnlyCollection<RequestStatus>? Statuses,
    RequestType? RequestType,
    DateTime? CreatedFrom,
    DateTime? CreatedTo,
    RequestSortField SortBy,
    SortDirection SortDirection,
    int Page,
    int PageSize,
    int? RestrictToUserId);
