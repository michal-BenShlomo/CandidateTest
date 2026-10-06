import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  Paper,
} from '@mui/material';

const STATUS_OPTIONS = [
  { value: 'New', label: 'חדש' },
  { value: 'InProgress', label: 'בטיפול' },
  { value: 'Completed', label: 'הושלם' },
  { value: 'Cancelled', label: 'בוטל' },
];

const REQUEST_TYPE_OPTIONS = [
  { value: 'General', label: 'כללי' },
  { value: 'Legal', label: 'משפטי' },
  { value: 'Payment', label: 'תשלום' },
  { value: 'Appeal', label: 'ערעור' },
];

const EMPTY_FILTERS = {
  search: '',
  statuses: [],
  requestType: null,
  createdFrom: null,
  createdTo: null,
};

function FilterPanel({ filters, onApplyFilters }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [dateErrors, setDateErrors] = useState({ createdFrom: false, createdTo: false });
  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (e) => {
    setLocalFilters({ ...localFilters, search: e.target.value });
  };

  const handleStatusChange = (event) => {
    const { value } = event.target;
    setLocalFilters({
      ...localFilters,
      statuses: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleRequestTypeChange = (e) => {
    const value = e.target.value || null;
    setLocalFilters({ ...localFilters, requestType: value });
  };

  const isValidFullDate = (dateString) => {
    if (!dateString) return true;
    // Check format YYYY-MM-DD with complete values
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    // Verify it's a valid date
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const hasPartialDateInput = (inputRef) => {
    if (!inputRef?.current) return false;
    const input = inputRef.current.querySelector('input');
    if (!input) return false;
    // Check native validity - browsers set badInput when date is incomplete
    return input.validity.badInput;
  };

  const handleDateChange = (field) => (e) => {
    const value = e.target.value || null;
    // Clear error when user enters a valid date
    if (value && isValidFullDate(value)) {
      setDateErrors({ ...dateErrors, [field]: false });
    }
    setLocalFilters({ ...localFilters, [field]: value });
  };

  const handleDateBlur = (field, inputRef) => (e) => {
    // Check if the date input has partial/invalid input
    const hasPartial = hasPartialDateInput(inputRef);
    
    if (hasPartial) {
      // Set error state
      setDateErrors({ ...dateErrors, [field]: true });
      // Return focus to the field
      setTimeout(() => {
        const input = inputRef.current?.querySelector('input');
        if (input) {
          input.focus();
        }
      }, 0);
    } else {
      setDateErrors({ ...dateErrors, [field]: false });
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleClear = () => {
    setLocalFilters(EMPTY_FILTERS);
    setDateErrors({ createdFrom: false, createdTo: false });
    onApplyFilters(EMPTY_FILTERS);
  };

  const hasActiveFilters =
    localFilters.search ||
    (localFilters.statuses && localFilters.statuses.length > 0) ||
    localFilters.requestType ||
    localFilters.createdFrom ||
    localFilters.createdTo;

  const isStartDateMissing = localFilters.createdTo && !localFilters.createdFrom;
  const isEndDateMissing = localFilters.createdFrom && !localFilters.createdTo;
  const isStartDateInvalid = localFilters.createdFrom && !isValidFullDate(localFilters.createdFrom);
  const isEndDateInvalid = localFilters.createdTo && !isValidFullDate(localFilters.createdTo);
  const isDateRangeInvalid = isStartDateMissing || isEndDateMissing || isStartDateInvalid || isEndDateInvalid || dateErrors.createdFrom || dateErrors.createdTo;

  const getStatusLabel = (value) => {
    const option = STATUS_OPTIONS.find(o => o.value === value);
    return option ? option.label : value;
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }} dir="rtl">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
        }}
      >
        <TextField
          label="מספר בקשה"
          variant="outlined"
          size="small"
          value={localFilters.search || ''}
          onChange={handleSearchChange}
          placeholder="חפש לפי מספר בקשה..."
        />

        <FormControl size="small">
          <InputLabel id="status-label">סטטוס</InputLabel>
          <Select
            labelId="status-label"
            id="status-select"
            multiple
            value={localFilters.statuses || []}
            onChange={handleStatusChange}
            input={<OutlinedInput label="סטטוס" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip 
                    key={value} 
                    label={getStatusLabel(value)} 
                    size="small" 
                    sx={{ minWidth: 60, justifyContent: 'center' }}
                  />
                ))}
              </Box>
            )}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="request-type-label">סוג בקשה</InputLabel>
          <Select
            labelId="request-type-label"
            id="request-type-select"
            value={localFilters.requestType || ''}
            onChange={handleRequestTypeChange}
            label="סוג בקשה"
          >
            <MenuItem value="">כל הסוגים</MenuItem>
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          ref={fromDateRef}
          label="מתאריך"
          type="date"
          variant="outlined"
          size="small"
          value={localFilters.createdFrom || ''}
          onChange={handleDateChange('createdFrom')}
          onBlur={handleDateBlur('createdFrom', fromDateRef)}
          InputLabelProps={{ shrink: true }}
          required={!!localFilters.createdTo}
          error={isStartDateMissing || isStartDateInvalid || dateErrors.createdFrom}
          helperText={isStartDateMissing ? 'חובה להזין מתאריך' : (isStartDateInvalid || dateErrors.createdFrom) ? 'יש להזין תאריך מלא' : ''}
        />

        <TextField
          ref={toDateRef}
          label="עד תאריך"
          type="date"
          variant="outlined"
          size="small"
          value={localFilters.createdTo || ''}
          onChange={handleDateChange('createdTo')}
          onBlur={handleDateBlur('createdTo', toDateRef)}
          InputLabelProps={{ shrink: true }}
          required={!!localFilters.createdFrom}
          error={isEndDateMissing || isEndDateInvalid || dateErrors.createdTo}
          helperText={isEndDateMissing ? 'חובה להזין עד תאריך' : (isEndDateInvalid || dateErrors.createdTo) ? 'יש להזין תאריך מלא' : ''}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid #e0e0e0', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleApply} disabled={isDateRangeInvalid}>
          סנן
        </Button>
        <Button variant="outlined" onClick={handleClear} disabled={!hasActiveFilters}>
          נקה
        </Button>
      </Box>
    </Paper>
  );
}

export default FilterPanel;
