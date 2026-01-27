/**
 * Format a timestamp as a relative time string (e.g. "5m ago", "2h ago", "3d ago").
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string}
 */
export function relativeTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
