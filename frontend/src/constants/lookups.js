// Mirrors Requests.Domain.Entities.RequestStatus / RequestType (int enums).
// Kept as plain lookup tables rather than duplicating backend code - if the
// backend enums change, these need to be updated too (a small tradeoff for
// not having a shared contracts package in this exercise).

export const STATUS_OPTIONS = [
  { value: 1, label: 'New' },
  { value: 2, label: 'In Progress' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Cancelled' },
];

export const REQUEST_TYPE_OPTIONS = [
  { value: 1, label: 'General' },
  { value: 2, label: 'Legal' },
  { value: 3, label: 'Payment' },
  { value: 4, label: 'Appeal' },
];

export const SORT_FIELD_OPTIONS = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'requestNumber', label: 'Request Number' },
  { value: 'status', label: 'Status' },
  { value: 'requestType', label: 'Request Type' },
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));
const TYPE_LABELS = Object.fromEntries(REQUEST_TYPE_OPTIONS.map((o) => [o.value, o.label]));

export const statusLabel = (value) => STATUS_LABELS[value] ?? `Unknown (${value})`;
export const requestTypeLabel = (value) => TYPE_LABELS[value] ?? `Unknown (${value})`;
