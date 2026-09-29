using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public sealed class RequestService : IRequestService
{
    private const int MaxPageSize = 200;

    private static readonly IReadOnlySet<string> ValidSortDirections =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "asc", "desc" };

    private readonly IRequestRepository _repository;

    public RequestService(IRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<RequestDto>> GetRequestsAsync(
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default)
    {
        var requests = await _repository.GetAllAsync(cancellationToken);

        if (!isAdministrator)
        {
            requests = requests
                .Where(x => x.OwnerId == currentUserId || x.AssignedToUserId == currentUserId)
                .ToList();
        }

        return requests.Select(ToDto).ToList();
    }

    public async Task<PagedResult<RequestDto>> SearchRequestsAsync(
        RequestSearchRequest request,
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default)
    {
        var filter = Validate(request, currentUserId, isAdministrator);

        var (items, totalCount) = await _repository.SearchAsync(filter, cancellationToken);

        return new PagedResult<RequestDto>(
            items.Select(ToDto).ToList(),
            totalCount,
            filter.Page,
            filter.PageSize);
    }

    /// <summary>
    /// Parses and validates the raw request, collecting every error before
    /// failing (so the caller can fix everything in one round trip) and
    /// applies the server-enforced ownership restriction.
    /// </summary>
    private static RequestSearchFilter Validate(
        RequestSearchRequest request,
        int currentUserId,
        bool isAdministrator)
    {
        var errors = new List<string>();

        var page = request.Page;
        if (page < 1)
        {
            errors.Add("Page must be greater than or equal to 1.");
        }

        var pageSize = request.PageSize;
        if (pageSize < 1 || pageSize > MaxPageSize)
        {
            errors.Add($"PageSize must be between 1 and {MaxPageSize}.");
        }

        if (request.CreatedFrom is { } from && request.CreatedTo is { } to && from > to)
        {
            errors.Add("CreatedFrom must not be later than CreatedTo.");
        }

        IReadOnlyCollection<RequestStatus>? statuses = null;
        if (request.Statuses is { Count: > 0 })
        {
            var parsedStatuses = new List<RequestStatus>();
            foreach (var value in request.Statuses)
            {
                if (Enum.IsDefined(typeof(RequestStatus), value))
                {
                    parsedStatuses.Add((RequestStatus)value);
                }
                else
                {
                    errors.Add($"'{value}' is not a valid Status.");
                }
            }

            statuses = parsedStatuses;
        }

        RequestType? requestType = null;
        if (request.RequestType is { } typeValue)
        {
            if (Enum.IsDefined(typeof(RequestType), typeValue))
            {
                requestType = (RequestType)typeValue;
            }
            else
            {
                errors.Add($"'{typeValue}' is not a valid RequestType.");
            }
        }

        if (!TryParseSortField(request.SortBy, out var sortField))
        {
            errors.Add($"'{request.SortBy}' is not a valid SortBy field. Allowed values: requestNumber, status, requestType, createdAt.");
        }

        if (!ValidSortDirections.Contains(request.SortDirection))
        {
            errors.Add($"'{request.SortDirection}' is not a valid SortDirection. Allowed values: asc, desc.");
        }

        if (errors.Count > 0)
        {
            throw new RequestValidationException(errors);
        }

        var sortDirection = string.Equals(request.SortDirection, "asc", StringComparison.OrdinalIgnoreCase)
            ? SortDirection.Ascending
            : SortDirection.Descending;

        return new RequestSearchFilter(
            RequestNumber: string.IsNullOrWhiteSpace(request.RequestNumber) ? null : request.RequestNumber.Trim(),
            Statuses: statuses,
            RequestType: requestType,
            CreatedFrom: request.CreatedFrom,
            CreatedTo: request.CreatedTo,
            SortBy: sortField,
            SortDirection: sortDirection,
            Page: page,
            PageSize: pageSize,
            RestrictToUserId: isAdministrator ? null : currentUserId);
    }

    private static bool TryParseSortField(string? value, out RequestSortField sortField)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            sortField = RequestSortField.CreatedAt;
            return true;
        }

        switch (value.Trim().ToLowerInvariant())
        {
            case "requestnumber":
                sortField = RequestSortField.RequestNumber;
                return true;
            case "status":
                sortField = RequestSortField.Status;
                return true;
            case "requesttype":
                sortField = RequestSortField.RequestType;
                return true;
            case "createdat":
                sortField = RequestSortField.CreatedAt;
                return true;
            default:
                sortField = RequestSortField.CreatedAt;
                return false;
        }
    }

    private static RequestDto ToDto(Request x) => new(
        x.Id,
        x.RequestNumber,
        x.CustomerId,
        x.OwnerId,
        x.AssignedToUserId,
        x.Status,
        x.RequestType,
        x.CreatedAt);
}
