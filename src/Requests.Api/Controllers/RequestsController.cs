using Microsoft.AspNetCore.Mvc;
using Requests.Application.Requests;
using Requests.Domain.Entities;

namespace Requests.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController(IRequestService service) : ControllerBase
{
    private static readonly HashSet<string> ValidStatuses = 
        new(Enum.GetNames<RequestStatus>(), StringComparer.OrdinalIgnoreCase);
    
    private static readonly HashSet<string> ValidRequestTypes = 
        new(Enum.GetNames<RequestType>(), StringComparer.OrdinalIgnoreCase);
    
    private static readonly HashSet<string> ValidSortByFields = 
        new(StringComparer.OrdinalIgnoreCase) { "id", "requestNumber", "status", "requestType", "createdAt" };

    [HttpGet]
    public async Task<ActionResult<PagedResult<RequestDto>>> Search(
        [FromQuery] SearchRequestBody body,
        CancellationToken cancellationToken = default)
    {
        // Validate statuses
        var statusesList = body.GetStatusesList();
        if (statusesList.Count > 0)
        {
            var invalidStatuses = statusesList.Where(s => !ValidStatuses.Contains(s)).ToList();
            if (invalidStatuses.Count > 0)
            {
                return BadRequest(new { error = $"Invalid status value(s): {string.Join(", ", invalidStatuses)}. Valid values: {string.Join(", ", ValidStatuses)}" });
            }
        }

        // Validate requestType
        if (!string.IsNullOrWhiteSpace(body.RequestType) && !ValidRequestTypes.Contains(body.RequestType))
        {
            return BadRequest(new { error = $"Invalid requestType: '{body.RequestType}'. Valid values: {string.Join(", ", ValidRequestTypes)}" });
        }

        // Validate date range
        if (body.CreatedFrom.HasValue && body.CreatedTo.HasValue && body.CreatedFrom > body.CreatedTo)
        {
            return BadRequest(new { error = "createdFrom cannot be later than createdTo." });
        }

        // Validate sortBy
        if (!string.IsNullOrWhiteSpace(body.SortBy) && !ValidSortByFields.Contains(body.SortBy))
        {
            return BadRequest(new { error = $"Invalid sortBy: '{body.SortBy}'. Valid values: {string.Join(", ", ValidSortByFields)}" });
        }

        // Validate sortDir
        if (!string.IsNullOrWhiteSpace(body.SortDir) && 
            !body.SortDir.Equals("asc", StringComparison.OrdinalIgnoreCase) && 
            !body.SortDir.Equals("desc", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "sortDir must be 'asc' or 'desc'." });
        }

        // Validate page
        if (body.Page < 1)
        {
            return BadRequest(new { error = "page must be >= 1." });
        }

        // Validate pageSize
        if (body.PageSize < -1 || body.PageSize == 0)
        {
            return BadRequest(new { error = "pageSize must be >= 1, or -1 for all results." });
        }

        var (userId, isAdmin) = GetUserContext();
        var result = await service.SearchAsync(body, userId, isAdmin, cancellationToken);
        return Ok(result);
    }

    private (int userId, bool isAdmin) GetUserContext()
    {
        var userId = int.TryParse(Request.Headers["X-User-Id"].FirstOrDefault(), out var id) ? id : 1;
        var isAdmin = string.Equals(
            Request.Headers["X-Is-Admin"].FirstOrDefault(),
            "true",
            StringComparison.OrdinalIgnoreCase);
        
        return (userId, isAdmin);
    }
}
