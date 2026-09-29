namespace Requests.Application.Requests;

/// <summary>
/// Raw, loosely-typed search input as received from the API layer (query
/// string). Kept separate from <see cref="RequestSearchFilter"/> so that
/// validation/parsing happens in one place (the service) and can be unit
/// tested without any ASP.NET dependency.
/// </summary>
public sealed class RequestSearchRequest
{
    public string? RequestNumber { get; init; }

    public List<int>? Statuses { get; init; }

    public int? RequestType { get; init; }

    public DateTime? CreatedFrom { get; init; }

    public DateTime? CreatedTo { get; init; }

    public string SortBy { get; init; } = "createdAt";

    public string SortDirection { get; init; } = "desc";

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}
