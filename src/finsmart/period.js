const DAY = 24 * 60 * 60 * 1000;
const monthFormat = new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' });
const dayFormat = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDayFormat = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' });

export const startOfDay = (time) => new Date(time).setHours(0, 0, 0, 0);

export const formatDay = (time) => dayFormat.format(time);
export const formatShortDay = (time) => shortDayFormat.format(time);

/** The current month for monthly budgets; the budget's own dates (inclusive) for one-off budgets. */
export function activePeriod(budget, now = Date.now()) {
  if (budget.kind === 'monthly') {
    const today = new Date(now);
    const start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime();
    return { start, end, label: monthFormat.format(start) };
  }

  const start = budget.startDate ?? startOfDay(budget.createdAt);
  const lastDay = budget.endDate ?? start;
  return {
    start,
    end: lastDay + DAY,
    label: `${shortDayFormat.format(start)} - ${dayFormat.format(lastDay)}`,
  };
}

/** Reads DDMMYYYY or DDMMYY as typed on a keypad; returns the start of that day, or null. */
export function parseKeypadDate(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 8 && digits.length !== 6) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = digits.length === 8 ? Number(digits.slice(4)) : 2000 + Number(digits.slice(4));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.getTime();
}
