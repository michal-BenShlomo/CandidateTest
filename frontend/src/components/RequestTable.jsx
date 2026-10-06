import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Chip,
} from '@mui/material';

const STATUS_MAP = {
  1: { label: 'חדש', color: 'info' },
  2: { label: 'בטיפול', color: 'warning' },
  3: { label: 'הושלם', color: 'success' },
  4: { label: 'בוטל', color: 'error' },
};

const REQUEST_TYPE_MAP = {
  1: 'כללי',
  2: 'משפטי',
  3: 'תשלום',
  4: 'ערעור',
};

function RequestTable({ items, sorting, onSortChange }) {
  const sortableColumns = ['requestNumber', 'status', 'requestType', 'createdAt'];

  const handleSortClick = (column) => {
    if (sortableColumns.includes(column)) {
      onSortChange(column);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    // { id: 'id', label: 'מזהה', sortable: false },
    { id: 'requestNumber', label: 'מספר בקשה', sortable: true },
    // { id: 'customerId', label: 'מזהה לקוח', sortable: false },
    { id: 'ownerId', label: 'בעלים', sortable: false },
    { id: 'assignedToUserId', label: 'מטפל', sortable: false },
    { id: 'status', label: 'סטטוס', sortable: true },
    { id: 'requestType', label: 'סוג בקשה', sortable: true },
    { id: 'createdAt', label: 'תאריך יצירה', sortable: true },
  ];

  const renderHeaderCell = (column) => {
    const isActive = sorting.sortBy === column.id;
    const direction = isActive ? sorting.sortDir : 'asc';

    if (column.sortable) {
      return (
        <TableCell key={column.id} sx={{ fontWeight: 600, textAlign: 'right' }}>
          <TableSortLabel
            active={isActive}
            direction={direction}
            onClick={() => handleSortClick(column.id)}
          >
            {column.label}
          </TableSortLabel>
        </TableCell>
      );
    }

    return (
      <TableCell key={column.id} sx={{ fontWeight: 600, textAlign: 'right' }}>
        {column.label}
      </TableCell>
    );
  };

  const getCellValue = (request, columnId) => {
    switch (columnId) {
      case 'assignedToUserId':
        return request.assignedToUserId ?? '-';
      case 'createdAt':
        return formatDate(request.createdAt);
      case 'status': {
        const statusInfo = STATUS_MAP[request.status] || { label: request.status, color: 'default' };
        return <Chip label={statusInfo.label} color={statusInfo.color} size="small" sx={{ minWidth: 70, justifyContent: 'center' }} />;
      }
      case 'requestType':
        return REQUEST_TYPE_MAP[request.requestType] || request.requestType;
      default:
        return request[columnId];
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }} dir="rtl">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            {columns.map(renderHeaderCell)}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">לא נמצאו בקשות</Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((request) => (
              <TableRow
                key={request.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} sx={{ textAlign: 'right' }}>
                    {getCellValue(request, column.id)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default RequestTable;
