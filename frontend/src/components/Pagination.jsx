/**
 * Page navigation + page size selector. Kept dumb/controlled: parent owns
 * the page/pageSize state and passes down the total count for computing
 * the number of pages.
 */
export function Pagination({ page, pageSize, totalCount, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="pagination">
      <span>
        Page {page} of {totalPages} ({totalCount} results)
      </span>
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
      <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
        {[10, 20, 50, 100].map((size) => (
          <option key={size} value={size}>{size} / page</option>
        ))}
      </select>
    </div>
  );
}
