using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public interface IRequestService
{
    Task<IReadOnlyList<RequestDto>> GetRequestsAsync(
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default);

    Task<PagedResult<RequestDto>> SearchAsync(
        SearchRequestBody request,
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default);
}
