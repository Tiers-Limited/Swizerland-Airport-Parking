export const bookingStatusLabels: Record<string, string> = {
  draft: 'Pending',
  pending_payment: 'Pending',
  pending_approval: 'Pending',
  confirmed: 'Confirmed',
  modified: 'Modified',
  checked_in: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Cancelled',
  active: 'Active',
};

export const bookingStatusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'> = {
  draft: 'gray',
  pending_payment: 'warning',
  pending_approval: 'warning',
  confirmed: 'success',
  modified: 'info',
  checked_in: 'primary',
  completed: 'gray',
  cancelled: 'error',
  refunded: 'error',
  active: 'success',
};

export function getBookingStatusLabel(status?: string): string {
  if (!status) return 'Pending';
  return bookingStatusLabels[status] || status.replaceAll('_', ' ');
}

export function getBookingStatusVariant(status?: string): 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary' {
  if (!status) return 'gray';
  return bookingStatusVariants[status] || 'gray';
}