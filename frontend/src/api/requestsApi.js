/**
 * Thin wrapper around fetch for talking to the Requests API.
 *
 * The exercise's "authentication" is a pair of request headers
 * (X-User-Id / X-Is-Admin). In a real system this would be a JWT/session
 * cookie instead - kept simple here to match the backend as given.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:60702';

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function buildQueryString(params) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else {
      search.append(key, value);
    }
  });

  return search.toString();
}

export async function searchRequests(filters, currentUser, signal) {
  const query = buildQueryString({
    requestNumber: filters.requestNumber,
    statuses: filters.statuses,
    requestType: filters.requestType,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  const response = await fetch(`${API_BASE_URL}/api/requests/search?${query}`, {
    method: 'GET',
    signal,
    headers: {
      'X-User-Id': String(currentUser.userId),
      'X-Is-Admin': String(currentUser.isAdmin),
    },
  });

  if (!response.ok) {
    let errors;
    try {
      const body = await response.json();
      errors = body?.errors;
    } catch {
      // response had no JSON body - ignore, we still surface the status.
    }
    throw new ApiError(`Request failed with status ${response.status}`, response.status, errors);
  }

  return response.json();
}
