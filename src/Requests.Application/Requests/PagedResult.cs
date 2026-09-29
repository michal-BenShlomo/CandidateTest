namespace Requests.Application.Requests;

/// <summary>
/// A page of results together with the total number of matching records
/// (needed by the client to render pagination controls).
/// </summary>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize);
