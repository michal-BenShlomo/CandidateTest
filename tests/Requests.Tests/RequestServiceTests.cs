using Requests.Application.Requests;
using Requests.Domain.Entities;
using Xunit;

namespace Requests.Tests;

public class RequestServiceTests
{
    [Fact]
    public async Task Administrator_CanSeeAllRequests()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 2),
            Create(2, ownerId: 3, assignedTo: 4)
        ]);

        var service = new RequestService(repository);

        var result = await service.GetRequestsAsync(1, true);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task RegularUser_CanSeeOwnedOrAssignedRequests()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 5),
            Create(2, ownerId: 3, assignedTo: 1),
            Create(3, ownerId: 3, assignedTo: 5)
        ]);

        var service = new RequestService(repository);

        var result = await service.GetRequestsAsync(1, false);

        Assert.Equal(2, result.Count);
        Assert.DoesNotContain(result, x => x.Id == 3);
    }

    [Fact]
    public async Task Search_RegularUser_OnlySeesOwnedOrAssignedRequests_EvenWithoutExplicitFilter()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 5),
            Create(2, ownerId: 3, assignedTo: 1),
            Create(3, ownerId: 3, assignedTo: 5)
        ]);
        var service = new RequestService(repository);

        var result = await service.SearchRequestsAsync(new RequestSearchRequest(), currentUserId: 1, isAdministrator: false);

        Assert.Equal(2, result.TotalCount);
        Assert.DoesNotContain(result.Items, x => x.Id == 3);
    }

    [Fact]
    public async Task Search_Administrator_SeesAllMatchingRequests()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 5),
            Create(2, ownerId: 3, assignedTo: 4)
        ]);
        var service = new RequestService(repository);

        var result = await service.SearchRequestsAsync(new RequestSearchRequest(), currentUserId: 1, isAdministrator: true);

        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task Search_FiltersByPartialRequestNumber()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 1, requestNumber: "REQ-000111"),
            Create(2, ownerId: 1, assignedTo: 1, requestNumber: "REQ-000222")
        ]);
        var service = new RequestService(repository);

        var result = await service.SearchRequestsAsync(
            new RequestSearchRequest { RequestNumber = "111" }, currentUserId: 1, isAdministrator: true);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("REQ-000111", result.Items.Single().RequestNumber);
    }

    [Fact]
    public async Task Search_FiltersByMultipleStatuses()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 1, status: RequestStatus.New),
            Create(2, ownerId: 1, assignedTo: 1, status: RequestStatus.InProgress),
            Create(3, ownerId: 1, assignedTo: 1, status: RequestStatus.Completed)
        ]);
        var service = new RequestService(repository);

        var result = await service.SearchRequestsAsync(
            new RequestSearchRequest { Statuses = [(int)RequestStatus.New, (int)RequestStatus.Completed] },
            currentUserId: 1,
            isAdministrator: true);

        Assert.Equal(2, result.TotalCount);
        Assert.DoesNotContain(result.Items, x => x.Status == RequestStatus.InProgress);
    }

    [Fact]
    public async Task Search_FiltersByCreatedDateRange()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 1, createdAt: new DateTime(2025, 1, 1)),
            Create(2, ownerId: 1, assignedTo: 1, createdAt: new DateTime(2025, 6, 1)),
            Create(3, ownerId: 1, assignedTo: 1, createdAt: new DateTime(2025, 12, 1))
        ]);
        var service = new RequestService(repository);

        var result = await service.SearchRequestsAsync(
            new RequestSearchRequest
            {
                CreatedFrom = new DateTime(2025, 2, 1),
                CreatedTo = new DateTime(2025, 7, 1)
            },
            currentUserId: 1,
            isAdministrator: true);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal(2, result.Items.Single().Id);
    }

    [Fact]
    public async Task Search_PagesResults_AndReturnsTotalCountAcrossAllPages()
    {
        var repository = new FakeRequestRepository(
            Enumerable.Range(1, 25).Select(i => Create(i, ownerId: 1, assignedTo: 1)).ToList());
        var service = new RequestService(repository);

        var result = await service.SearchRequestsAsync(
            new RequestSearchRequest { Page = 2, PageSize = 10 }, currentUserId: 1, isAdministrator: true);

        Assert.Equal(25, result.TotalCount);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(2, result.Page);
    }

    [Theory]
    [InlineData(0, 20)]     // page below 1
    [InlineData(1, 0)]      // page size below 1
    [InlineData(1, 1000)]   // page size above max
    public async Task Search_InvalidPaging_ThrowsValidationException(int page, int pageSize)
    {
        var service = new RequestService(new FakeRequestRepository([]));

        await Assert.ThrowsAsync<RequestValidationException>(() =>
            service.SearchRequestsAsync(
                new RequestSearchRequest { Page = page, PageSize = pageSize },
                currentUserId: 1,
                isAdministrator: true));
    }

    [Fact]
    public async Task Search_CreatedFromAfterCreatedTo_ThrowsValidationException()
    {
        var service = new RequestService(new FakeRequestRepository([]));

        await Assert.ThrowsAsync<RequestValidationException>(() =>
            service.SearchRequestsAsync(
                new RequestSearchRequest
                {
                    CreatedFrom = new DateTime(2025, 6, 1),
                    CreatedTo = new DateTime(2025, 1, 1)
                },
                currentUserId: 1,
                isAdministrator: true));
    }

    [Fact]
    public async Task Search_InvalidStatusValue_ThrowsValidationException()
    {
        var service = new RequestService(new FakeRequestRepository([]));

        var exception = await Assert.ThrowsAsync<RequestValidationException>(() =>
            service.SearchRequestsAsync(
                new RequestSearchRequest { Statuses = [999] }, currentUserId: 1, isAdministrator: true));

        Assert.Contains(exception.Errors, e => e.Contains("999"));
    }

    [Fact]
    public async Task Search_InvalidSortBy_ThrowsValidationException()
    {
        var service = new RequestService(new FakeRequestRepository([]));

        await Assert.ThrowsAsync<RequestValidationException>(() =>
            service.SearchRequestsAsync(
                new RequestSearchRequest { SortBy = "notAField" }, currentUserId: 1, isAdministrator: true));
    }

    private static Request Create(
        int id,
        int ownerId,
        int assignedTo,
        string? requestNumber = null,
        RequestStatus status = RequestStatus.New,
        DateTime? createdAt = null)
        => new()
        {
            Id = id,
            RequestNumber = requestNumber ?? $"REQ-{id:000}",
            CustomerId = id,
            OwnerId = ownerId,
            AssignedToUserId = assignedTo,
            Status = status,
            RequestType = RequestType.General,
            CreatedAt = createdAt ?? DateTime.UtcNow
        };

    /// <summary>
    /// In-memory stand-in for the EF Core repository. Mirrors the same
    /// filter/sort/page semantics as <c>RequestRepository.SearchAsync</c> so
    /// that <see cref="RequestService"/> can be unit tested without a DB.
    /// </summary>
    private sealed class FakeRequestRepository : IRequestRepository
    {
        private readonly List<Request> _requests;

        public FakeRequestRepository(List<Request> requests)
        {
            _requests = requests;
        }

        public Task<List<Request>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(_requests);

        public Task<(List<Request> Items, int TotalCount)> SearchAsync(
            RequestSearchFilter filter,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<Request> query = _requests;

            if (filter.RestrictToUserId is int userId)
            {
                query = query.Where(r => r.OwnerId == userId || r.AssignedToUserId == userId);
            }

            if (!string.IsNullOrWhiteSpace(filter.RequestNumber))
            {
                query = query.Where(r => r.RequestNumber.Contains(filter.RequestNumber, StringComparison.OrdinalIgnoreCase));
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

            var totalCount = query.Count();

            var ascending = filter.SortDirection == SortDirection.Ascending;
            query = filter.SortBy switch
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
                _ => ascending
                    ? query.OrderBy(r => r.CreatedAt).ThenBy(r => r.Id)
                    : query.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id)
            };

            var items = query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

            return Task.FromResult((items, totalCount));
        }
    }
}
