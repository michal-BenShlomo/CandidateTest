import { requestTypeLabel, statusLabel } from '../constants/lookups';

const COLUMNS = [
  { key: 'requestNumber', label: 'Request Number' },
  { key: 'status', label: 'Status' },
  { key: 'requestType', label: 'Type' },
  { key: 'createdAt', label: 'Created At' },
];

/**
 * Renders the results table with clickable, sortable column headers.
 * Loading / error / empty states are handled by the parent (App) so this
 * component only ever renders when there is data to show.
 */
export function RequestsTable({ items, sortBy, sortDirection, onSortChange }) {
  const handleHeaderClick = (columnKey) => {
    if (sortBy === columnKey) {
      onSortChange(columnKey, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(columnKey, 'asc');
    }
  };

  return (
    <table className="requests-table">
      <thead>
        <tr>
          {COLUMNS.map((column) => (
            <th key={column.key}>
              <button
                type="button"
                className="sort-header"
                onClick={() => handleHeaderClick(column.key)}
                aria-sort={sortBy === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {column.label}
                {sortBy === column.key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
              </button>
            </th>
          ))}
          <th>Owner</th>
          <th>Assigned To</th>
        </tr>
      </thead>
      <tbody>
        {items.map((request) => (
          <tr key={request.id}>
            <td>{request.requestNumber}</td>
            <td>
              <span className={`status-badge status-${request.status}`}>
                {statusLabel(request.status)}
              </span>
            </td>
            <td>{requestTypeLabel(request.requestType)}</td>
            <td>{new Date(request.createdAt).toLocaleDateString()}</td>
            <td>{request.ownerId}</td>
            <td>{request.assignedToUserId ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
