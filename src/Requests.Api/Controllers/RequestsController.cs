
using Microsoft.AspNetCore.Mvc;
using Requests.Application.Requests;

namespace Requests.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly IRequestService _service;

    public RequestsController(IRequestService service)
    {
        _service = service;
    }

    // For the exercise, the current user is supplied through headers:
    // X-User-Id: integer
    // X-Is-Admin: true|false
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RequestDto>>> Get(
        CancellationToken cancellationToken)
    {
        var userId = ParseUserId(Request.Headers["X-User-Id"].FirstOrDefault());
        var isAdmin = string.Equals(
            Request.Headers["X-Is-Admin"].FirstOrDefault(),
            "true",
            StringComparison.OrdinalIgnoreCase);

        var result = await _service.GetRequestsAsync(userId, isAdmin, cancellationToken);
        return Ok(result);
    }

    // Search/filter/sort/page endpoint. All parameters are optional query
    // string values, e.g.:
    // /api/requests/search?requestNumber=REQ-000&statuses=1&statuses=2
    //   &requestType=2&createdFrom=2025-01-01&createdTo=2025-12-31
    //   &sortBy=createdAt&sortDirection=desc&page=1&pageSize=20
    [HttpGet("search")]
    public async Task<ActionResult<PagedResult<RequestDto>>> Search(
        [FromQuery] RequestSearchRequest request,
        CancellationToken cancellationToken)
    {
        var userId = ParseUserId(Request.Headers["X-User-Id"].FirstOrDefault());
        var isAdmin = string.Equals(
            Request.Headers["X-Is-Admin"].FirstOrDefault(),
            "true",
            StringComparison.OrdinalIgnoreCase);

        try
        {
            var result = await _service.SearchRequestsAsync(request, userId, isAdmin, cancellationToken);
            return Ok(result);
        }
        catch (RequestValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors });
        }
    }

    private static int ParseUserId(string? value)
        => int.TryParse(value, out var userId) ? userId : 1;
}
