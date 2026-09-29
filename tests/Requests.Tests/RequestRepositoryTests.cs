using Microsoft.EntityFrameworkCore;
using Requests.Application.Requests;
using Requests.Domain.Entities;
using Requests.Infrastructure.Persistence;
using Requests.Infrastructure.Repositories;
using Xunit;

namespace Requests.Tests;

/// <summary>
/// Exercises RequestRepository.SearchAsync against a real EF Core DbContext
/// (InMemory provider) to make sure the LINQ expressions used for
/// filtering/sorting/paging actually translate and execute - not just that
/// they compile.
/// </summary>
public class RequestRepositoryTests
{
    private static RequestsDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<RequestsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new RequestsDbContext(options);

        db.Requests.AddRange(
            new Request { Id = 1, RequestNumber = "REQ-000111", CustomerId = 1, OwnerId = 1, AssignedToUserId = 2, Status = RequestStatus.New, RequestType = RequestType.General, CreatedAt = new DateTime(2025, 1, 10), UpdatedAt = new DateTime(2025, 1, 10) },
            new Request { Id = 2, RequestNumber = "REQ-000222", CustomerId = 2, OwnerId = 3, AssignedToUserId = 1, Status = RequestStatus.InProgress, RequestType = RequestType.Legal, CreatedAt = new DateTime(2025, 3, 10), UpdatedAt = new DateTime(2025, 3, 10) },
            new Request { Id = 3, RequestNumber = "REQ-000333", CustomerId = 3, OwnerId = 3, AssignedToUserId = 4, Status = RequestStatus.Completed, RequestType = RequestType.Payment, CreatedAt = new DateTime(2025, 6, 10), UpdatedAt = new DateTime(2025, 6, 10) });

        db.SaveChanges();
        return db;
    }

    [Fact]
    public async Task SearchAsync_FiltersSortsAndPages()
    {
        using var db = CreateContext();
        var repository = new RequestRepository(db);

        var filter = new RequestSearchFilter(
            RequestNumber: "REQ",
            Statuses: null,
            RequestType: null,
            CreatedFrom: null,
            CreatedTo: null,
            SortBy: RequestSortField.CreatedAt,
            SortDirection: SortDirection.Ascending,
            Page: 1,
            PageSize: 2,
            RestrictToUserId: null);

        var (items, totalCount) = await repository.SearchAsync(filter);

        Assert.Equal(3, totalCount);
        Assert.Equal(2, items.Count);
        Assert.Equal(1, items[0].Id);
        Assert.Equal(2, items[1].Id);
    }

    [Fact]
    public async Task SearchAsync_EnforcesOwnershipRestriction()
    {
        using var db = CreateContext();
        var repository = new RequestRepository(db);

        var filter = new RequestSearchFilter(
            RequestNumber: null,
            Statuses: null,
            RequestType: null,
            CreatedFrom: null,
            CreatedTo: null,
            SortBy: RequestSortField.CreatedAt,
            SortDirection: SortDirection.Ascending,
            Page: 1,
            PageSize: 20,
            RestrictToUserId: 1);

        var (items, totalCount) = await repository.SearchAsync(filter);

        Assert.Equal(2, totalCount);
        Assert.DoesNotContain(items, r => r.Id == 3);
    }
}
