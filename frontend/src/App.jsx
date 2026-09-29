import { useMemo, useState } from 'react';
import './App.css';
import { SearchFilters } from './components/SearchFilters';
import { RequestsTable } from './components/RequestsTable';
import { Pagination } from './components/Pagination';
import { UserSwitcher } from './components/UserSwitcher';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useRequestsSearch } from './hooks/useRequestsSearch';

const INITIAL_FILTERS = {
  requestNumberInput: '',
  statuses: [],
  requestType: undefined,
  createdFrom: undefined,
  createdTo: undefined,
  sortBy: 'createdAt',
  sortDirection: 'desc',
  page: 1,
  pageSize: 20,
};

function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentUser, setCurrentUser] = useState({ userId: 1, isAdmin: false });

  // Only the free-text field is debounced; every other filter (checkboxes,
  // selects, dates, paging, sorting) should apply immediately since those
  // are discrete "click" interactions, not typing.
  const debouncedRequestNumber = useDebouncedValue(filters.requestNumberInput, 400);

  const effectiveFilters = useMemo(
    () => ({ ...filters, requestNumber: debouncedRequestNumber }),
    [filters, debouncedRequestNumber],
  );

  const { data, status, error } = useRequestsSearch(effectiveFilters, currentUser);

  const handleSortChange = (sortBy, sortDirection) => {
    setFilters((prev) => ({ ...prev, sortBy, sortDirection, page: 1 }));
  };

  const handleClearFilters = () => setFilters(INITIAL_FILTERS);

  return (
    <div className="app">
      <header>
        <h1>Requests Search</h1>
        <UserSwitcher currentUser={currentUser} onChange={setCurrentUser} />
      </header>

      <SearchFilters filters={filters} onChange={setFilters} onClear={handleClearFilters} />

      <main>
        {status === 'loading' && <p className="status-message">Loading…</p>}

        {status === 'error' && (
          <p className="status-message error">Failed to load requests: {error}</p>
        )}

        {status === 'success' && data && data.items.length === 0 && (
          <p className="status-message">No requests match the current filters.</p>
        )}

        {status === 'success' && data && data.items.length > 0 && (
          <>
            <RequestsTable
              items={data.items}
              sortBy={filters.sortBy}
              sortDirection={filters.sortDirection}
              onSortChange={handleSortChange}
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              onPageSizeChange={(pageSize) => setFilters((prev) => ({ ...prev, pageSize, page: 1 }))}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;

