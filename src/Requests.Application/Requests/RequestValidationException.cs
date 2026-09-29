namespace Requests.Application.Requests;

/// <summary>
/// Thrown when a search request contains invalid input (bad enum values,
/// bad ranges, unknown sort field, etc). The controller maps this to a 400
/// response with the list of human readable errors.
/// </summary>
public sealed class RequestValidationException : Exception
{
    public IReadOnlyList<string> Errors { get; }

    public RequestValidationException(IReadOnlyList<string> errors)
        : base("Validation failed: " + string.Join("; ", errors))
    {
        Errors = errors;
    }
}
