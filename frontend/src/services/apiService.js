async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error('Unable to connect to the server. Please check your network connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 400) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Invalid request');
    }
    throw new Error('Server error. Please try again later.');
  }
  return response.json();
}

export async function searchRequests(params, userContext) {
  const queryParams = new URLSearchParams();
  
  // Helper: append only if value exists
  const append = (key, value) => {
    if (value != null && value !== '') queryParams.append(key, value);
  };

  append('requestNumber', params.search?.trim());
  if (params.statuses?.length > 0) {
    append('statuses', params.statuses.join(','));
  }
  append('requestType', params.requestType);
  append('createdFrom', params.createdFrom);
  append('createdTo', params.createdTo);
  append('sortBy', params.sortBy);
  append('sortDir', params.sortDir);
  append('page', params.page);
  append('pageSize', params.pageSize);

  const url = `/api/requests?${queryParams}`;
  console.log('Calling API:', url);
  
  return request(url, {
    method: 'GET',
    headers: {
      'X-User-Id': userContext.userId.toString(),
      'X-Is-Admin': userContext.isAdmin ? 'true' : 'false',
    },
  });
}
