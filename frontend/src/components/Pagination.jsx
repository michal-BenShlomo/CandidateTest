import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';

function Pagination({ page, pageSize, totalCount, totalPages, onPageChange, onPageSizeChange, loading }) {
  const pageSizeOptions = [
    { value: 10, label: '10' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: -1, label: '(הכל)'},
  ];

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handleFirst = () => {
    if (page > 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (page < totalPages) {
      onPageChange(totalPages);
    }
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value, 10);
    onPageSizeChange(newPageSize);
  };

  const isShowingAll = pageSize === -1 || pageSize >= totalCount;
  const startItem = totalCount === 0 ? 0 : (page - 1) * (pageSize === -1 ? totalCount : pageSize) + 1;
  const endItem = isShowingAll ? totalCount : Math.min(page * pageSize, totalCount);
  const displayPageSize = pageSize > 100 ? -1 : pageSize;

  const getInfoText = () => {
    if (isShowingAll) {
      return 'מציג את כל ' + totalCount.toLocaleString('he-IL') + ' הפריטים';
    }
    return 'מציג ' + startItem.toLocaleString('he-IL') + ' - ' + endItem.toLocaleString('he-IL') + ' מתוך ' + totalCount.toLocaleString('he-IL') + ' פריטים';
  };

  const getPageText = () => {
    if (isShowingAll) {
      return 'כל הפריטים';
    }
    return 'עמוד ' + page + ' מתוך ' + (totalPages || 1);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        py: 1.5,
        opacity: loading ? 0.6 : 1,
        pointerEvents: loading ? 'none' : 'auto',
      }}
      dir="rtl"
    >
      <Typography variant="body2" color="text.secondary">
        {getInfoText()}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleFirst}
          disabled={page <= 1 || isShowingAll || loading}
        >
          ראשון
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handlePrevious}
          disabled={page <= 1 || isShowingAll || loading}
        >
          הקודם
        </Button>
        <Typography variant="body2" sx={{ px: 1 }}>
          {getPageText()}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleNext}
          disabled={page >= totalPages || isShowingAll || loading}
        >
          הבא
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleLast}
          disabled={page >= totalPages || isShowingAll || loading}
        >
          אחרון
        </Button>
      </Box>

      <FormControl size="small" sx={{ minWidth: 120 }} disabled={loading}>
        <InputLabel id="page-size-label">פריטים בעמוד</InputLabel>
        <Select
          labelId="page-size-label"
          id="page-size-select"
          value={displayPageSize}
          label="פריטים בעמוד"
          onChange={handlePageSizeChange}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
}

export default Pagination;
