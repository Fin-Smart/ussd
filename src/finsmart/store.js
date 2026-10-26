/** Each account's budgets, income and progress live under their own key. */
export const dataKey = (phone) => `finsmart-ussd:data:${phone}`;

/** crypto.randomUUID only exists on https and localhost, so phones testing over the LAN need a fallback. */
export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function emptyData(currency = 'ZAR') {
  return {
    version: 1,
    currency,
    income: null,
    budgets: [],
    transactions: [],
    learn: { read: [], best: {} },
    shieldFlagged: 0,
  };
}

/** A realistic month for a South African user, dated relative to today so it always looks current. */
export function demoData(now = Date.now()) {
  const today = new Date(now);
  const year = today.getFullYear();
  const month = today.getMonth();
  const onDay = (day) => new Date(year, month, Math.min(day, today.getDate()), 9, 0).getTime();
  const created = new Date(year, month, 1).getTime();

  const category = (id, name, rand) => ({ id, name, limitCents: rand * 100 });
  const budget = (id, name, label, kind, rand, categories, dates = {}) => ({
    id,
    name,
    label,
    kind,
    startDate: dates.startDate ?? null,
    endDate: dates.endDate ?? null,
    currency: 'ZAR',
    availableCents: rand * 100,
    categories,
    createdAt: created,
    updatedAt: created,
  });

  const holidayYear = month === 11 && today.getDate() > 15 ? year + 1 : year;
  const holidayStart = new Date(holidayYear, 11, 15).getTime();
  const holidayEnd = new Date(holidayYear + 1, 0, 5).getTime();

  const budgets = [
    budget('essentials', 'Monthly essentials', 'Household', 'monthly', 12000, [
      category('rent', 'Rent', 5000),
      category('groceries', 'Groceries', 3000),
      category('transport', 'Transport', 1500),
      category('electricity', 'Electricity', 800),
      category('airtime', 'Airtime & data', 400),
      category('savings', 'Savings', 1300),
    ]),
    budget('fun', 'Fun & eating out', 'Personal', 'monthly', 1500, [
      category('takeaways', 'Takeaways', 600),
      category('outings', 'Movies & outings', 500),
      category('streaming', 'Streaming', 400),
    ]),
    budget(
      'holiday',
      'December holiday',
      'Holiday',
      'oneoff',
      4000,
      [
        category('travel', 'Travel', 1500),
        category('stay', 'Accommodation', 1500),
        category('food', 'Food', 700),
        category('gifts', 'Gifts', 300),
      ],
      { startDate: holidayStart, endDate: holidayEnd },
    ),
  ];

  const entry = (budgetId, categoryId, rand, day, note, extra = {}) => ({
    id: newId(),
    budgetId,
    amountCents: Math.round(rand * 100),
    direction: 'out',
    categoryId,
    note,
    date: onDay(day),
    source: 'manual',
    sourceId: null,
    detected: false,
    createdAt: onDay(day),
    ...extra,
  });

  const transactions = [
    entry('essentials', 'rent', 5000, 1, 'Rent paid', { marksPaid: true }),
    entry('essentials', 'electricity', 500, 2, 'Prepaid electricity'),
    entry('essentials', 'groceries', 850, 3, 'Checkers'),
    entry('essentials', 'transport', 600, 5, 'Taxi fare'),
    entry('essentials', 'airtime', 199, 8, 'Data bundle'),
    entry('essentials', 'groceries', 1240, 12, 'Pick n Pay monthly shop'),
    entry('essentials', 'transport', 450, 15, 'Taxi fare'),
    entry('fun', 'takeaways', 380, 6, 'KFC'),
    entry('fun', 'streaming', 399, 7, 'Netflix and Spotify'),
    entry('fun', 'outings', 620, 10, 'Movies with friends'),
  ];

  return {
    ...emptyData('ZAR'),
    income: { kind: 'monthly', amountCents: 1_850_000, currency: 'ZAR', updatedAt: created },
    budgets,
    transactions,
  };
}

/** New accounts start empty; the demo data is only loaded on request from Settings. */
function loadData(phone) {
  try {
    const parsed = JSON.parse(localStorage.getItem(dataKey(phone)) ?? 'null');
    if (parsed?.version === 1) return parsed;
  } catch {
    // Unreadable storage starts the account empty.
  }
  return emptyData();
}

function saveData(phone, data) {
  try {
    localStorage.setItem(dataKey(phone), JSON.stringify(data));
  } catch {
    // Private browsing can refuse storage; the session still works in memory.
  }
}

/**
 * The `ctx` every USSD screen reads from: the signed-in account's data plus copy-on-write
 * updates that persist. `pendingSteps` holds a shortcut code's menu path until the PIN is entered.
 */
export function createStore() {
  let phone = null;
  let data = null;
  return {
    pendingSteps: [],
    get phone() {
      return phone;
    },
    get data() {
      return data;
    },
    signIn(nextPhone) {
      phone = nextPhone;
      data = loadData(nextPhone);
    },
    signOut() {
      phone = null;
      data = null;
    },
    update(mutate) {
      if (!phone) return;
      const next = structuredClone(data);
      mutate(next);
      data = next;
      saveData(phone, data);
    },
    replace(next) {
      if (!phone) return;
      data = next;
      saveData(phone, data);
    },
  };
}
