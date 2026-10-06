namespace Requests.Application.Requests;

public class SearchRequestBody
{
    public string? RequestNumber { get; set; }
    public string? Statuses { get; set; }  // Comma-separated: "New,InProgress"
    public string? RequestType { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
    public string SortBy { get; set; } = "createdAt";
    public string SortDir { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;

    // Helper to get statuses as list
    public List<string> GetStatusesList() =>
        string.IsNullOrWhiteSpace(Statuses) 
            ? [] 
            : Statuses.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
}
