import { REQUEST_TYPE_OPTIONS, STATUS_OPTIONS } from '../constants/lookups';

/**
 * Controlled filter form. All values live in the parent's `filters` state;
 * this component only renders inputs and calls back on change so the
 * parent stays the single source of truth (simpler to reason about than
 * duplicating state here).
 */
export function SearchFilters({ filters, onChange, onClear }) {
  const toggleStatus = (statusValue) => {
    const current = filters.statuses ?? [];
    const next = current.includes(statusValue)
      ? current.filter((s) => s !== statusValue)
      : [...current, statusValue];
    onChange({ ...filters, statuses: next, page: 1 });
  };

  return (
    <form className="search-filters" onSubmit={(e) => e.preventDefault()}>
      <div className="field">
        <label htmlFor="requestNumber">Request Number</label>
        <input
          id="requestNumber"
          type="text"
          placeholder="e.g. REQ-000123"
          value={filters.requestNumberInput}
          onChange={(e) => onChange({ ...filters, requestNumberInput: e.target.value, page: 1 })}
        />
      </div>

      <fieldset className="field">
        <legend>Status</legend>
        <div className="checkbox-group">
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value} className="checkbox-option">
              <input
                type="checkbox"
                checked={(filters.statuses ?? []).includes(option.value)}
                onChange={() => toggleStatus(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="requestType">Request Type</label>
        <select
          id="requestType"
          value={filters.requestType ?? ''}
          onChange={(e) => onChange({ ...filters, requestType: e.target.value || undefined, page: 1 })}
        >
          <option value="">All</option>
          {REQUEST_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="createdFrom">Created From</label>
        <input
          id="createdFrom"
          type="date"
          value={filters.createdFrom ?? ''}
          onChange={(e) => onChange({ ...filters, createdFrom: e.target.value || undefined, page: 1 })}
        />
      </div>

      <div className="field">
        <label htmlFor="createdTo">Created To</label>
        <input
          id="createdTo"
          type="date"
          value={filters.createdTo ?? ''}
          onChange={(e) => onChange({ ...filters, createdTo: e.target.value || undefined, page: 1 })}
        />
      </div>

      <button type="button" className="secondary" onClick={onClear}>
        Clear filters
      </button>
    </form>
  );
}
