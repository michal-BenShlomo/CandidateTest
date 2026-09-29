namespace Requests.Application.Requests;

public interface IRequestService
{
    Task<IReadOnlyList<RequestDto>> GetRequestsAsync(
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates <paramref name="request"/> and returns a page of requests
    /// matching the search/filter criteria. Ownership restriction for
    /// non-administrators is enforced here (server side), regardless of
    /// what the client asked for.
    /// </summary>
    /// <exception cref="RequestValidationException">
    /// Thrown when the request contains invalid input.
    /// </exception>
    Task<PagedResult<RequestDto>> SearchRequestsAsync(
        RequestSearchRequest request,
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default);
}
