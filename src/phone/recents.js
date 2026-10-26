const KEY = 'finsmart-ussd:recents';
const MAX_RECENTS = 30;

export function loadRecents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecent(recents, number, kind) {
  const next = [{ number, kind, at: Date.now() }, ...recents].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Recents are optional.
  }
  return next;
}

const timeFormat = new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
const weekdayFormat = new Intl.DateTimeFormat('en-ZA', { weekday: 'long' });
const dateFormat = new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: '2-digit', year: '2-digit' });

/** Same style as iOS Recents: time today, "Yesterday", the weekday this week, then a date. */
export function formatRecentTime(time, now = Date.now()) {
  const day = (value) => new Date(value).setHours(0, 0, 0, 0);
  const daysAgo = Math.round((day(now) - day(time)) / 86_400_000);
  if (daysAgo <= 0) return timeFormat.format(time);
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return weekdayFormat.format(time);
  return dateFormat.format(time);
}
