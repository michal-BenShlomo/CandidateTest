using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public interface IRequestRepository
{
    Task<List<Request>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<PagedResult<RequestDto>> SearchAsync(
        SearchRequestBody request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);
}
