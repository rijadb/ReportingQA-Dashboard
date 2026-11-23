
namespace ReportingQA.Application.DTOs;

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();

    public long TotalCount { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }

    public long TotalPages =>
        TotalCount / PageSize +
        (TotalCount % PageSize > 0 ? 1L : 0L);
}
