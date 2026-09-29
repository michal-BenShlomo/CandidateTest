using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public interface IRequestRepository
{
    Task<List<Request>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes filtering, sorting and paging entirely at the query level
    /// (translated to SQL by EF Core) so that only one page of rows is ever
    /// materialized - required to scale to millions of records.
    /// </summary>
    Task<(List<Request> Items, int TotalCount)> SearchAsync(
        RequestSearchFilter filter,
        CancellationToken cancellationToken = default);
}
