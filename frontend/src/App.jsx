import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Backdrop, CircularProgress } from '@mui/material';
import { searchRequests } from './services/apiService.js';
import FilterPanel from './components/FilterPanel.jsx';
import RequestTable from './components/RequestTable.jsx';
import Pagination from './components/Pagination.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import UserContextPanel from './components/UserContextPanel.jsx';
import logoImage from '../public/images/moj-logo.png';

const theme = createTheme({
  palette: { primary: { main: '#1976d2' } },
  typography: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
});

const INITIAL_FILTERS = {
  search: '',
  statuses: [],
  requestType: null,
  createdFrom: null,
  createdTo: null,
};

function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sorting, setSorting] = useState({ sortBy: 'createdAt', sortDir: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25 });
  const [userContext, setUserContext] = useState({ userId: 1, isAdmin: false });
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, ...sorting, ...pagination };
      const data = await searchRequests(params, userContext);
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [filters, sorting, pagination, userContext]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleToggleSort = (columnName) => {
    setSorting(prev => ({
      sortBy: columnName,
      sortDir: prev.sortBy === columnName && prev.sortDir === 'asc' ? 'desc' : 
               prev.sortBy === columnName ? 'asc' : 'desc',
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} open={loading}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Box sx={{ mt: 2, fontSize: '1.2rem' }}>טוען...</Box>
        </Box>
      </Backdrop>

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 3, flex: 1, pb: result ? 10 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <img src={logoImage} alt="MOJ Logo" style={{ height: 60 }} />
          </Box>

          <UserContextPanel userContext={userContext} onUserContextChange={setUserContext} />
          <FilterPanel filters={filters} onApplyFilters={handleApplyFilters} />
          <ErrorMessage error={error} />

          {!error && result && (
            <RequestTable items={result.items} sorting={sorting} onSortChange={handleToggleSort} />
          )}
        </Container>

        {!error && result && (
          <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#fff', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
            <Container maxWidth="lg">
              <Pagination
                page={result.page}
                pageSize={result.pageSize}
                totalCount={result.totalCount}
                totalPages={result.totalPages}
                onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                onPageSizeChange={(newPageSize) => setPagination({ pageSize: newPageSize, page: 1 })}
                loading={loading}
              />
            </Container>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
