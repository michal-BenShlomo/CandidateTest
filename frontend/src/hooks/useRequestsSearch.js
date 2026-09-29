import { useEffect, useRef, useState } from 'react';
import { ApiError, searchRequests } from '../api/requestsApi';

/**
 * Fetches a page of requests whenever `filters` or `currentUser` change.
 * Handles the loading / error / empty states and cancels the in-flight
 * request if a newer one is triggered before it completes (avoids race
 * conditions where an old, slow response overwrites a newer one).
 */
export function useRequestsSearch(filters, currentUser) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    searchRequests(filters, currentUser, controller.signal)
      .then((result) => {
        setData(result);
        setStatus('success');
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }
        const message = err instanceof ApiError && err.errors?.length
          ? err.errors.join(' ')
          : err.message || 'Unexpected error while loading requests.';
        setError(message);
        setStatus('error');
      });

    return () => controller.abort();
  }, [filters, currentUser]);

  return { data, status, error };
}
