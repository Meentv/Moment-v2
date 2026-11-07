export function dateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDay(key) {
  if (!isValidDay(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function isValidDay(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split('-').map(Number);
  if (year < 1900 || year > 2200) return false;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function addDays(value, amount) {
  const date = value instanceof Date ? new Date(value) : parseDay(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function startOfWeek(value, weekStart = 'monday') {
  const date = value instanceof Date ? new Date(value) : parseDay(value);
  const first = weekStart === 'sunday' ? 0 : 1;
  date.setDate(date.getDate() - ((date.getDay() - first + 7) % 7));
  date.setHours(12, 0, 0, 0);
  return date;
}

export function monthGrid(value, weekStart = 'monday') {
  const date = value instanceof Date ? value : parseDay(value);
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
  const start = startOfWeek(first, weekStart);
  const end = addDays(startOfWeek(last, weekStart), 6);
  const days = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) days.push(cursor);
  return days;
}

export function formatDate(value, options = {}) {
  if (!value) return 'No date';
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDay(value) : new Date(value);
  if (!date || Number.isNaN(date.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...options }).format(date);
}

export function dueLabel(key, today = dateKey()) {
  if (!key) return 'No date';
  if (key === today) return 'Today';
  if (key === dateKey(addDays(today, 1))) return 'Tomorrow';
  if (key === dateKey(addDays(today, -1))) return 'Yesterday';
  return formatDate(key, { ...(parseDay(key)?.getFullYear() !== parseDay(today)?.getFullYear() ? { year: 'numeric' } : {}) });
}

export function relativeTime(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (elapsed < 60000) return 'Just now';
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`;
  if (elapsed < 604800000) return `${Math.floor(elapsed / 86400000)}d ago`;
  return formatDate(value);
}

export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
}

export function clock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
