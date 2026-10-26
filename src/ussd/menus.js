import {
  changePin,
  deleteAccount,
  findAccount,
  forgetDevice,
  formatPhone,
  PIN_LENGTH,
  pinProblem,
  verifyPin,
} from '../finsmart/accounts';
import { allocateIncome, countsAgainstIncome, INCOME_LABELS } from '../finsmart/income';
import { findLesson, LESSONS, shuffledQuiz } from '../finsmart/lessons';
import { CURRENCY_OPTIONS, formatMoney, parseMoney } from '../finsmart/money';
import { formatDay, formatShortDay, parseKeypadDate, startOfDay } from '../finsmart/period';
import { suggestSplit } from '../finsmart/planner';
import { assessMessage, SCAM_EXAMPLES } from '../finsmart/scamDetector';
import { demoData, emptyData, newId } from '../finsmart/store';
import { computeAlerts, summarizeAll } from '../finsmart/summary';

export const USSD_CODE = '*120*3762#';
export const GOODBYE = `Thank you for using FinSmart. Dial ${USSD_CODE} anytime.`;

const NEAR_LIMIT = 0.9;
const BUDGET_LABELS = ['Household', 'Personal', 'Holiday', 'Event', 'Savings goal', 'Other'];

const findSummary = (ctx, budgetId) => summarizeAll(ctx.data).find((summary) => summary.budget.id === budgetId);
const missingBudget = () => ({ body: 'This budget no longer exists.' });
const enterAmount = (value) => {
  const cents = parseMoney(value);
  return cents && cents > 0 ? cents : null;
};
const AMOUNT_ERROR = 'Enter an amount, e.g. 150 or 150*50';

function statusLine({ budget, remainingCents, receivedCents }) {
  const money = (cents) => formatMoney(cents, budget.currency);
  return remainingCents < 0
    ? `Over budget by ${money(-remainingCents)}`
    : `Left: ${money(remainingCents)} of ${money(budget.availableCents + receivedCents)}`;
}

function budgetWarning({ budget, spentCents, receivedCents, remainingCents }) {
  const total = budget.availableCents + receivedCents;
  if (remainingCents < 0) return `${budget.name} is over budget.`;
  if (total > 0 && spentCents / total >= NEAR_LIMIT) return `${budget.name} is almost used up.`;
  return null;
}

/** Keeps entries inside the budget's period, e.g. for a one-off budget that starts later. */
const entryDate = (period) => Math.min(Math.max(Date.now(), period.start), period.end - 1);

function addEntry(ctx, summary, entry) {
  const date = entryDate(summary.period);
  ctx.update((data) => {
    data.transactions.push({
      id: newId(),
      budgetId: summary.budget.id,
      direction: 'out',
      categoryId: null,
      note: '',
      source: 'manual',
      sourceId: null,
      detected: false,
      date,
      createdAt: Date.now(),
      ...entry,
    });
  });
}

const updateBudget = (ctx, budgetId, mutate) =>
  ctx.update((data) => {
    const budget = data.budgets.find((item) => item.id === budgetId);
    if (!budget) return;
    mutate(budget, data);
    budget.updatedAt = Date.now();
  });

// ---------------------------------------------------------------- Main menu

export function mainMenu(ctx) {
  const alerts = computeAlerts(ctx.data).length;
  const name = findAccount(ctx.phone)?.name;
  return {
    body: name ? `FinSmart: Hi ${name}` : 'Welcome to FinSmart',
    items: [
      { label: 'My budgets', to: budgetsList },
      { label: 'Add expense', to: pickBudgetForExpense },
      { label: 'Income', to: incomeMenu },
      { label: 'New budget', to: newBudgetName },
      { label: 'Scam check', to: scamMenu },
      { label: 'Learn & quiz', to: learnMenu },
      { label: alerts ? `Alerts (${alerts})` : 'Alerts', to: alertsScreen },
      { label: 'Settings', to: settingsMenu },
    ],
  };
}

// ---------------------------------------------------------------- Budgets

function budgetsList(ctx) {
  const summaries = summarizeAll(ctx.data);
  if (summaries.length === 0) {
    return { body: 'You have no budgets yet.', items: [{ label: 'Create a budget', to: newBudgetName }] };
  }
  return {
    body: 'My budgets',
    items: [
      ...summaries.map((summary) => ({
        label:
          summary.remainingCents < 0
            ? `${summary.budget.name}: over ${formatMoney(-summary.remainingCents, summary.budget.currency)}`
            : `${summary.budget.name}: ${formatMoney(summary.remainingCents, summary.budget.currency)} left`,
        to: budgetDetail(summary.budget.id),
      })),
      { label: 'New budget', to: newBudgetName },
    ],
  };
}

const budgetDetail = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget, period, spentCents } = summary;
  return {
    body: [
      `${budget.name} (${budget.kind === 'monthly' ? 'Monthly' : 'One-off'})`,
      period.label,
      statusLine(summary),
      `Spent: ${formatMoney(spentCents, budget.currency)}`,
    ].join('\n'),
    items: [
      { label: 'Categories', to: categoriesMenu(budgetId) },
      { label: 'Add expense', to: expenseCategory(budgetId) },
      { label: 'Money in', to: moneyInAmount(budgetId) },
      { label: 'Mark as paid', to: paidMenu(budgetId) },
      { label: 'Recent entries', to: entriesMenu(budgetId) },
      { label: 'Change amount', to: changeAmount(budgetId) },
      { label: 'Delete budget', to: deleteBudgetConfirm(budgetId) },
    ],
  };
};

// Categories

const categoriesMenu = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget, spentByCategory, paidCategoryIds } = summary;
  const money = (cents) => formatMoney(cents, budget.currency);
  const lines = budget.categories.map((category) => {
    const spent = spentByCategory[category.id] ?? 0;
    const status = paidCategoryIds.includes(category.id) ? ' paid' : spent > category.limitCents ? ' over' : '';
    return `${category.name}: ${money(spent)}/${money(category.limitCents)}${status}`;
  });
  if (spentByCategory.uncategorised) lines.push(`No category: ${money(spentByCategory.uncategorised)}`);

  const unallocated = budget.availableCents - budget.categories.reduce((total, item) => total + item.limitCents, 0);
  if (budget.categories.length && unallocated > 0) lines.push(`Not in a category: ${money(unallocated)}`);
  if (unallocated < 0) lines.push(`Categories are ${money(-unallocated)} over the budget`);

  const items = [{ label: 'Add category', to: addCategoryName(budgetId) }];
  if (budget.categories.length) {
    items.push({ label: 'Change a limit', to: pickCategory(budgetId, 'limit') });
    items.push({ label: 'Remove category', to: pickCategory(budgetId, 'remove') });
  }
  return { body: [`${budget.name} categories`, ...(lines.length ? lines : ['No categories yet.'])].join('\n'), items };
};

const addCategoryName = (budgetId) => () => ({
  body: 'Category name, e.g. Groceries:',
  keyboard: 'text',
  onInput: (value) => {
    const name = value.trim().slice(0, 24);
    if (name.length < 2) return { error: 'Enter a name with at least 2 letters.' };
    return { replace: categoryLimit(budgetId, null, name) };
  },
});

const categoryLimit = (budgetId, categoryId, name) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget } = summary;
  const others = budget.categories
    .filter((item) => item.id !== categoryId)
    .reduce((total, item) => total + item.limitCents, 0);
  const free = budget.availableCents - others;
  return {
    body: `Monthly limit for ${name}:${free > 0 ? `\nStill to assign: ${formatMoney(free, budget.currency)}` : ''}`,
    onInput: (value) => {
      const cents = enterAmount(value);
      if (!cents) return { error: AMOUNT_ERROR };
      updateBudget(ctx, budgetId, (target) => {
        const existing = target.categories.find((item) => item.id === categoryId);
        if (existing) existing.limitCents = cents;
        else target.categories.push({ id: newId(), name, limitCents: cents });
      });
      return { back: true, notice: `${name}: limit ${formatMoney(cents, budget.currency)}. Saved.` };
    },
  };
};

const pickCategory = (budgetId, action) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  return {
    body: action === 'limit' ? 'Change the limit of:' : 'Remove which category?',
    items: summary.budget.categories.map((category) => ({
      label: `${category.name} ${formatMoney(category.limitCents, summary.budget.currency)}`,
      run: () => ({
        replace: action === 'limit' ? categoryLimit(budgetId, category.id, category.name) : removeCategoryConfirm(budgetId, category.id),
      }),
    })),
  };
};

const removeCategoryConfirm = (budgetId, categoryId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  const category = summary?.budget.categories.find((item) => item.id === categoryId);
  if (!category) return missingBudget();
  return {
    body: `Remove ${category.name}? Its spending stays in the budget without a category.`,
    items: [
      {
        label: 'Yes, remove',
        run: () => {
          ctx.update((data) => {
            const budget = data.budgets.find((item) => item.id === budgetId);
            budget.categories = budget.categories.filter((item) => item.id !== categoryId);
            budget.updatedAt = Date.now();
            data.transactions = data.transactions
              .filter((item) => !(item.budgetId === budgetId && item.categoryId === categoryId && item.marksPaid))
              .map((item) => (item.budgetId === budgetId && item.categoryId === categoryId ? { ...item, categoryId: null } : item));
          });
          return { back: true, notice: `${category.name} removed.` };
        },
      },
      { label: 'No, keep it', run: () => ({ back: true }) },
    ],
  };
};

// Expenses

function pickBudgetForExpense(ctx) {
  const budgets = ctx.data.budgets;
  if (budgets.length === 0) {
    return { body: 'Create a budget first to track spending.', items: [{ label: 'New budget', to: newBudgetName }] };
  }
  if (budgets.length === 1) return expenseCategory(budgets[0].id)(ctx);
  return {
    body: 'Add expense to which budget?',
    items: budgets.map((budget) => ({ label: budget.name, to: expenseCategory(budget.id) })),
  };
}

const expenseCategory = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget, spentByCategory, paidCategoryIds } = summary;
  return {
    body: `${budget.name}\nWhat did you spend on?`,
    items: [
      ...budget.categories.map((category) => {
        const left = category.limitCents - (spentByCategory[category.id] ?? 0);
        const status = paidCategoryIds.includes(category.id)
          ? 'paid'
          : left < 0
            ? 'over'
            : `${formatMoney(left, budget.currency)} left`;
        return {
          label: `${category.name} (${status})`,
          to: expenseAmount(budgetId, category.id),
        };
      }),
      { label: 'No category', to: expenseAmount(budgetId, null) },
    ],
  };
};

const expenseAmount = (budgetId, categoryId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const category = summary.budget.categories.find((item) => item.id === categoryId);
  return {
    body: `${category ? category.name : 'No category'}\nEnter the amount spent:`,
    onInput: (value) => {
      const cents = enterAmount(value);
      return cents ? expenseNote(budgetId, categoryId, cents) : { error: AMOUNT_ERROR };
    },
  };
};

const expenseNote = (budgetId, categoryId, cents) => () => ({
  body: 'Add a short note, e.g. Checkers:',
  keyboard: 'text',
  items: [{ label: 'Skip', to: expenseConfirm(budgetId, categoryId, cents, '') }],
  onInput: (value) => expenseConfirm(budgetId, categoryId, cents, value.trim().slice(0, 40)),
});

const expenseConfirm = (budgetId, categoryId, cents, note) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget } = summary;
  const category = budget.categories.find((item) => item.id === categoryId);
  return {
    body: [
      `Add ${formatMoney(cents, budget.currency)}${category ? ` for ${category.name}` : ''} to ${budget.name}?`,
      note ? `Note: ${note}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    items: [
      {
        label: 'Confirm',
        run: () => {
          addEntry(ctx, summary, { amountCents: cents, categoryId, note });
          return { reset: expenseSaved(budgetId, categoryId, cents) };
        },
      },
      { label: 'Cancel', run: () => ({ reset: budgetDetail(budgetId), notice: 'Expense not saved.' }) },
    ],
  };
};

const expenseSaved = (budgetId, categoryId, cents) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget, spentByCategory } = summary;
  const money = (value) => formatMoney(value, budget.currency);
  const category = budget.categories.find((item) => item.id === categoryId);
  const categoryOver = category ? (spentByCategory[category.id] ?? 0) - category.limitCents : 0;
  return {
    body: [
      `Saved ${money(cents)}${category ? ` for ${category.name}` : ''}.`,
      statusLine(summary),
      categoryOver > 0 ? `${category.name} is ${money(categoryOver)} over its limit.` : null,
      budgetWarning(summary),
    ]
      .filter(Boolean)
      .join('\n'),
    items: [
      { label: 'Add another', to: expenseCategory(budgetId) },
      { label: 'Open budget', to: budgetDetail(budgetId) },
    ],
  };
};

// Money in

const moneyInAmount = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  return {
    body: `Money in for ${summary.budget.name}, e.g. a refund.\nEnter the amount:`,
    onInput: (value) => {
      const cents = enterAmount(value);
      return cents ? { replace: moneyInNote(budgetId, cents) } : { error: AMOUNT_ERROR };
    },
  };
};

const moneyInNote = (budgetId, cents) => (ctx) => {
  const save = (note) => {
    const summary = findSummary(ctx, budgetId);
    if (!summary) return { home: true };
    addEntry(ctx, summary, { amountCents: cents, direction: 'in', note });
    return { back: true, notice: `Added ${formatMoney(cents, summary.budget.currency)} to ${summary.budget.name}.` };
  };
  return {
    body: 'Add a short note, e.g. Refund:',
    keyboard: 'text',
    items: [{ label: 'Skip', run: () => save('') }],
    onInput: (value) => save(value.trim().slice(0, 40)),
  };
};

// Mark as paid: ticking records whatever is left of the category as paid; unticking removes it.

const paidMenu = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget, spentByCategory, paidCategoryIds } = summary;
  if (budget.categories.length === 0) {
    return { body: 'This budget has no categories yet.', items: [{ label: 'Add category', to: addCategoryName(budgetId) }] };
  }
  return {
    body: 'Tick an item once it is paid:',
    items: budget.categories.map((category) => {
      const left = Math.max(category.limitCents - (spentByCategory[category.id] ?? 0), 0);
      return {
        label: paidCategoryIds.includes(category.id)
          ? `${category.name} (paid)`
          : `${category.name} ${formatMoney(left, budget.currency)}`,
        to: paidConfirm(budgetId, category.id),
      };
    }),
  };
};

const paidConfirm = (budgetId, categoryId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  const category = summary?.budget.categories.find((item) => item.id === categoryId);
  if (!category) return missingBudget();
  const money = (cents) => formatMoney(cents, summary.budget.currency);
  const markers = summary.transactions.filter((item) => item.marksPaid && item.categoryId === categoryId);

  if (markers.length > 0) {
    const total = markers.reduce((sum, item) => sum + item.amountCents, 0);
    return {
      body: `Mark ${category.name} as not paid?${total ? ` This removes the ${money(total)} payment.` : ''}`,
      items: [
        {
          label: 'Yes',
          run: () => {
            const ids = new Set(markers.map((item) => item.id));
            ctx.update((data) => {
              data.transactions = data.transactions.filter((item) => !ids.has(item.id));
            });
            return { back: true, notice: `${category.name} marked as not paid.` };
          },
        },
        { label: 'No', run: () => ({ back: true }) },
      ],
    };
  }

  const amount = Math.max(category.limitCents - (summary.spentByCategory[categoryId] ?? 0), 0);
  return {
    body: `Mark ${category.name} as paid?${amount ? ` This records ${money(amount)} spent.` : ''}`,
    items: [
      {
        label: 'Yes',
        run: () => {
          addEntry(ctx, summary, { amountCents: amount, categoryId, note: `${category.name} paid`, marksPaid: true });
          return { back: true, notice: `${category.name} marked as paid.` };
        },
      },
      { label: 'No', run: () => ({ back: true }) },
    ],
  };
};

// Entries

const categoryName = (budget, categoryId) =>
  budget.categories.find((item) => item.id === categoryId)?.name ?? (categoryId ? 'Removed' : 'No category');

const entriesMenu = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget } = summary;
  // A tick on an already fully spent category records nothing worth listing.
  const entries = summary.transactions.filter((item) => !(item.marksPaid && item.amountCents === 0)).slice(0, 9);
  if (entries.length === 0) {
    return { body: `No entries for ${summary.period.label} yet.`, items: [{ label: 'Add expense', to: expenseCategory(budgetId) }] };
  }
  return {
    body: `Entries for ${summary.period.label}:`,
    items: entries.map((item) => ({
      label: `${formatShortDay(item.date)} ${item.direction === 'in' ? '+' : '-'}${formatMoney(item.amountCents, budget.currency)} ${
        item.direction === 'in' ? 'Money in' : categoryName(budget, item.categoryId)
      }`,
      to: entryDetail(budgetId, item.id),
    })),
  };
};

const entryDetail = (budgetId, entryId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  const entry = ctx.data.transactions.find((item) => item.id === entryId);
  if (!summary || !entry) return { body: 'This entry no longer exists.' };
  const { budget } = summary;
  return {
    body: [
      `${entry.direction === 'in' ? 'Money in' : categoryName(budget, entry.categoryId)}: ${formatMoney(entry.amountCents, budget.currency)}`,
      formatDay(entry.date),
      entry.note || null,
    ]
      .filter(Boolean)
      .join('\n'),
    items: [
      {
        label: 'Delete entry',
        run: () => ({
          replace: () => ({
            body: 'Delete this entry?',
            items: [
              {
                label: 'Yes, delete',
                run: () => {
                  ctx.update((data) => {
                    data.transactions = data.transactions.filter((item) => item.id !== entryId);
                  });
                  return { back: true, notice: 'Entry deleted.' };
                },
              },
              { label: 'No', run: () => ({ back: true }) },
            ],
          }),
        }),
      },
    ],
  };
};

// Amount and deletion

function freeIncomeLine(ctx, budget) {
  const income = ctx.data.income;
  if (!income || income.currency !== budget.currency || !countsAgainstIncome(budget, income)) return null;
  const { freeCents } = allocateIncome(income, ctx.data.budgets, budget.id);
  return `Free income: ${formatMoney(Math.max(freeCents, 0), income.currency)}`;
}

const changeAmount = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  const { budget } = summary;
  return {
    body: [
      `${budget.name} now has ${formatMoney(budget.availableCents, budget.currency)}${budget.kind === 'monthly' ? ' a month' : ''}.`,
      freeIncomeLine(ctx, budget),
      'Enter the new amount:',
    ]
      .filter(Boolean)
      .join('\n'),
    onInput: (value) => {
      const cents = enterAmount(value);
      if (!cents) return { error: AMOUNT_ERROR };
      updateBudget(ctx, budgetId, (target) => {
        target.availableCents = cents;
      });
      return { back: true, notice: `Saved. ${budget.name}: ${formatMoney(cents, budget.currency)}.` };
    },
  };
};

const deleteBudgetConfirm = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  return {
    body: `Delete ${summary.budget.name} and all its entries? This can't be undone.`,
    items: [
      {
        label: 'Yes, delete',
        run: () => {
          ctx.update((data) => {
            data.budgets = data.budgets.filter((item) => item.id !== budgetId);
            data.transactions = data.transactions.filter((item) => item.budgetId !== budgetId);
          });
          return { reset: budgetsList, notice: `${summary.budget.name} deleted.` };
        },
      },
      { label: 'No, keep it', run: () => ({ back: true }) },
    ],
  };
};

// ---------------------------------------------------------------- Income

function incomeMenu(ctx) {
  const { income, budgets } = ctx.data;
  if (!income) {
    return {
      body: 'Income\nNo income set yet. Add it to see how much is free to budget.',
      items: [
        { label: 'Monthly income (salary)', to: incomeAmount('monthly') },
        { label: 'Money you have (total)', to: incomeAmount('total') },
      ],
    };
  }
  const money = (cents) => formatMoney(cents, income.currency);
  const { allocatedCents, freeCents } = allocateIncome(income, budgets);
  const other = income.kind === 'monthly' ? 'total' : 'monthly';
  return {
    body: [
      `${INCOME_LABELS[income.kind]}: ${money(income.amountCents)}`,
      `In budgets: ${money(allocatedCents)}`,
      freeCents < 0 ? `Budgets are ${money(-freeCents)} more than you have` : `Free to budget: ${money(freeCents)}`,
    ].join('\n'),
    items: [
      { label: 'Change amount', to: incomeAmount(income.kind) },
      { label: `Switch to ${INCOME_LABELS[other].toLowerCase()}`, to: incomeAmount(other) },
      {
        label: 'Remove income',
        to: () => ({
          body: 'Remove your income?',
          items: [
            {
              label: 'Yes, remove',
              run: () => {
                ctx.update((data) => {
                  data.income = null;
                });
                return { back: true, notice: 'Income removed.' };
              },
            },
            { label: 'No', run: () => ({ back: true }) },
          ],
        }),
      },
    ],
  };
}

export const incomeAmount = (kind) => (ctx) => ({
  body: kind === 'monthly' ? 'Enter your monthly income after tax:' : 'Enter the total money you have:',
  onInput: (value) => {
    const cents = enterAmount(value);
    if (!cents) return { error: AMOUNT_ERROR };
    const currency = ctx.data.currency;
    ctx.update((data) => {
      data.income = { kind, amountCents: cents, currency, updatedAt: Date.now() };
    });
    return { back: true, notice: `${INCOME_LABELS[kind]} saved: ${formatMoney(cents, currency)}.` };
  },
});

// ---------------------------------------------------------------- New budget

export function newBudgetName() {
  return {
    body: 'New budget\nEnter a name, e.g. Groceries:',
    keyboard: 'text',
    onInput: (value) => {
      const name = value.trim().slice(0, 30);
      if (name.length < 2) return { error: 'Enter a name with at least 2 letters.' };
      return newBudgetKind({ name });
    },
  };
}

const newBudgetKind = (draft) => () => ({
  body: `${draft.name}\nWhat kind of budget?`,
  items: [
    { label: 'Monthly (resets each month)', to: newBudgetLabel({ ...draft, kind: 'monthly', startDate: null, endDate: null }) },
    { label: 'One-off (a trip or event)', to: newBudgetStart({ ...draft, kind: 'oneoff' }) },
  ],
});

const newBudgetStart = (draft) => () => ({
  body: 'Start date as DDMMYYYY, e.g. 15122026:',
  items: [{ label: 'Today', to: newBudgetEnd({ ...draft, startDate: startOfDay(Date.now()) }) }],
  onInput: (value) => {
    const startDate = parseKeypadDate(value);
    return startDate ? newBudgetEnd({ ...draft, startDate }) : { error: 'Use DDMMYYYY, e.g. 15122026' };
  },
});

const newBudgetEnd = (draft) => () => ({
  body: `Starts ${formatDay(draft.startDate)}.\nEnd date as DDMMYYYY:`,
  onInput: (value) => {
    const endDate = parseKeypadDate(value);
    if (!endDate) return { error: 'Use DDMMYYYY, e.g. 05012027' };
    if (endDate < draft.startDate) return { error: 'The end date must be on or after the start date.' };
    return newBudgetLabel({ ...draft, endDate });
  },
});

const newBudgetLabel = (draft) => () => ({
  body: 'What type of budget is it?',
  items: BUDGET_LABELS.map((label) => ({ label, to: newBudgetAmount({ ...draft, label }) })),
});

function draftFreeIncome(ctx, draft) {
  const income = ctx.data.income;
  if (!income || income.currency !== ctx.data.currency) return null;
  const candidate = { ...draft, currency: ctx.data.currency, createdAt: Date.now() };
  if (!countsAgainstIncome(candidate, income)) return null;
  return allocateIncome(income, ctx.data.budgets).freeCents;
}

const newBudgetAmount = (draft) => (ctx) => {
  const free = draftFreeIncome(ctx, draft);
  return {
    body: [
      `How much is available ${draft.kind === 'monthly' ? 'each month' : 'in total'}?`,
      free !== null ? `Free income: ${formatMoney(Math.max(free, 0), ctx.data.currency)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    onInput: (value) => {
      const cents = enterAmount(value);
      if (!cents) return { error: AMOUNT_ERROR };
      return newBudgetCategories({ ...draft, availableCents: cents, currency: ctx.data.currency, categories: [] });
    },
  };
};

const newBudgetCategories = (draft) => () => ({
  body: `${draft.name}: ${formatMoney(draft.availableCents, draft.currency)}\nSet up categories:`,
  items: [
    { label: 'FinSmart suggested split', to: newBudgetSplit(draft) },
    { label: 'Add my own', to: newBudgetCategoryName(draft) },
    { label: 'Skip for now', to: newBudgetConfirm(draft) },
  ],
});

const newBudgetSplit = (draft) => () => {
  const categories = suggestSplit(draft.label, draft.availableCents);
  return {
    body: ['Suggested split:', ...categories.map((item) => `${item.name}: ${formatMoney(item.limitCents, draft.currency)}`)].join('\n'),
    items: [
      { label: 'Use this split', to: newBudgetConfirm({ ...draft, categories }) },
      { label: 'Add my own instead', to: newBudgetCategoryName(draft) },
    ],
  };
};

const assigned = (draft) => draft.categories.reduce((total, item) => total + item.limitCents, 0);

const newBudgetCategoryName = (draft) => () => ({
  body: `Category ${draft.categories.length + 1} name, e.g. Rent:`,
  keyboard: 'text',
  onInput: (value) => {
    const name = value.trim().slice(0, 24);
    if (name.length < 2) return { error: 'Enter a name with at least 2 letters.' };
    return newBudgetCategoryLimit(draft, name);
  },
});

const newBudgetCategoryLimit = (draft, name) => () => {
  const left = draft.availableCents - assigned(draft);
  return {
    body: `Limit for ${name}:${left > 0 ? `\nStill to assign: ${formatMoney(left, draft.currency)}` : ''}`,
    onInput: (value) => {
      const cents = enterAmount(value);
      if (!cents) return { error: AMOUNT_ERROR };
      return newBudgetCategoryMore({ ...draft, categories: [...draft.categories, { name, limitCents: cents }] });
    },
  };
};

const newBudgetCategoryMore = (draft) => () => {
  const left = draft.availableCents - assigned(draft);
  const money = (cents) => formatMoney(cents, draft.currency);
  return {
    body: [
      ...draft.categories.map((item) => `${item.name}: ${money(item.limitCents)}`),
      left >= 0 ? `Still to assign: ${money(left)}` : `${money(-left)} over the amount`,
    ].join('\n'),
    items: [
      { label: 'Add another', to: newBudgetCategoryName(draft) },
      { label: 'Done', to: newBudgetConfirm(draft) },
    ],
  };
};

const newBudgetConfirm = (draft) => (ctx) => {
  const money = (cents) => formatMoney(cents, draft.currency);
  const total = assigned(draft);
  const free = draftFreeIncome(ctx, draft);
  return {
    body: [
      'Save this budget?',
      `${draft.name} (${draft.label})`,
      draft.kind === 'monthly' ? 'Monthly' : `${formatDay(draft.startDate)} - ${formatDay(draft.endDate)}`,
      `Amount: ${money(draft.availableCents)}`,
      draft.categories.length
        ? `${draft.categories.length} ${draft.categories.length === 1 ? 'category' : 'categories'}: ${money(total)}`
        : 'No categories yet',
      total > draft.availableCents ? `Categories are ${money(total - draft.availableCents)} over the amount.` : null,
      free !== null && draft.availableCents > free ? `This is ${money(draft.availableCents - Math.max(free, 0))} more than your free income.` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    items: [
      {
        label: 'Save budget',
        run: () => {
          const id = newId();
          const now = Date.now();
          ctx.update((data) => {
            data.budgets.push({
              id,
              name: draft.name,
              label: draft.label,
              kind: draft.kind,
              startDate: draft.startDate ?? null,
              endDate: draft.endDate ?? null,
              currency: draft.currency,
              availableCents: draft.availableCents,
              categories: draft.categories.map((item) => ({ id: newId(), ...item })),
              createdAt: now,
              updatedAt: now,
            });
          });
          return { reset: budgetSaved(id) };
        },
      },
      { label: 'Cancel', run: () => ({ home: true, notice: 'Budget not saved.' }) },
    ],
  };
};

const budgetSaved = (budgetId) => (ctx) => {
  const summary = findSummary(ctx, budgetId);
  if (!summary) return missingBudget();
  return {
    body: `${summary.budget.name} saved.\n${statusLine(summary)}`,
    items: [
      { label: 'Open budget', to: budgetDetail(budgetId) },
      { label: 'Add expense', to: expenseCategory(budgetId) },
    ],
  };
};

// ---------------------------------------------------------------- Scam check

const VERDICT = {
  safe: 'Looks safe',
  suspicious: 'Be careful',
  scam: 'Likely a scam',
};

const ADVICE = {
  safe: 'No warning signs found. Still, never share your PIN or OTP.',
  suspicious: 'Check with the company on their official number before you act.',
  scam: "Don't reply, click links or pay. Delete it and tell your bank.",
};

function scamMenu() {
  return {
    body: 'Scam check\nTest an SMS or email before you reply, click or pay.',
    items: [
      { label: 'Check a message', to: scamText },
      { label: 'Try an example', to: scamExamples },
      { label: 'Safety tips', to: scamTips },
    ],
  };
}

function scamText() {
  return {
    body: 'Type or paste the message:',
    keyboard: 'text',
    onInput: (value) => (value.trim().length < 5 ? { error: 'Enter the full message.' } : scamSender(value.trim())),
  };
}

const scamSender = (text) => () => ({
  body: 'Who sent it? Enter the number, name or email:',
  keyboard: 'text',
  items: [{ label: "Skip, I don't know", run: (ctx) => checkMessage(ctx, text, '') }],
  onInput: (value, ctx) => checkMessage(ctx, text, value.trim()),
});

function checkMessage(ctx, text, sender) {
  const assessment = assessMessage({ text, sender, channel: sender.includes('@') ? 'email' : 'sms' });
  if (assessment.level !== 'safe') {
    ctx.update((data) => {
      data.shieldFlagged += 1;
    });
  }
  return { reset: [scamMenu, scamResult(assessment)] };
}

const scamResult = (assessment) => () => ({
  body: [
    `${VERDICT[assessment.level]} (risk ${assessment.score}/100)`,
    ...assessment.reasons.slice(0, 3).map((reason) => `- ${reason}`),
    ADVICE[assessment.level],
  ].join('\n'),
  items: [{ label: 'Check another', to: scamText }],
});

function scamExamples() {
  return {
    body: 'Pick an example message:',
    items: SCAM_EXAMPLES.map((example) => ({ label: example.title, to: scamExample(example) })),
  };
}

const scamExample = (example) => () => ({
  body: `From: ${example.sender}\n"${example.text}"`,
  items: [{ label: 'Check it', run: (ctx) => checkMessage(ctx, example.text, example.sender) }],
});

function scamTips() {
  return {
    body: [
      'Stay safe:',
      '- Banks never ask for your PIN, OTP or password.',
      '- Real prizes never ask you to pay a fee first.',
      "- Don't pay with vouchers, airtime or crypto.",
      '- Call back on the official number, not the one in the message.',
    ].join('\n'),
  };
}

// ---------------------------------------------------------------- Learn & quiz

function learnMenu(ctx) {
  const { best } = ctx.data.learn;
  return {
    body: 'Learn & quiz\nPick a topic:',
    items: [
      ...LESSONS.map((lesson) => ({
        label: best[lesson.id] !== undefined ? `${lesson.title} (${best[lesson.id]}/${lesson.quiz.length})` : lesson.title,
        to: topicMenu(lesson.id),
      })),
      { label: 'My progress', to: progressScreen },
    ],
  };
}

const markRead = (ctx, lessonId) =>
  ctx.update((data) => {
    if (!data.learn.read.includes(lessonId)) data.learn.read.push(lessonId);
  });

const topicMenu = (lessonId) => (ctx) => {
  const lesson = findLesson(lessonId);
  const best = ctx.data.learn.best[lessonId];
  return {
    body: [lesson.title, best !== undefined ? `Best quiz score: ${best}/${lesson.quiz.length}` : null].filter(Boolean).join('\n'),
    items: [
      {
        label: 'Read the lesson',
        run: () => {
          markRead(ctx, lessonId);
          return lessonView(lessonId);
        },
      },
      { label: `Take the quiz (${lesson.quiz.length} questions)`, run: () => startQuiz(lessonId) },
    ],
  };
};

const lessonView = (lessonId) => () => {
  const lesson = findLesson(lessonId);
  return {
    body: [lesson.title, ...lesson.lesson].join('\n'),
    items: [{ label: 'Take the quiz', run: () => startQuiz(lessonId) }],
  };
};

const startQuiz = (lessonId) => ({ push: quizQuestion(lessonId, shuffledQuiz(findLesson(lessonId)), 0, 0) });

const quizQuestion = (lessonId, questions, index, score) => () => {
  const question = questions[index];
  return {
    body: `Q${index + 1}/${questions.length}: ${question.question}`,
    footer: '0. Exit quiz',
    items: question.options.map((option, choice) => ({
      label: option,
      run: () => {
        const correct = choice === question.correctIndex;
        return { replace: quizFeedback(lessonId, questions, index, score + (correct ? 1 : 0), correct) };
      },
    })),
  };
};

const quizFeedback = (lessonId, questions, index, score, correct) => () => {
  const question = questions[index];
  const last = index === questions.length - 1;
  return {
    body: [
      correct ? 'Correct!' : `Not quite. Answer: ${question.options[question.correctIndex]}`,
      question.explanation,
    ].join('\n'),
    footer: '0. Exit quiz',
    items: [
      last
        ? {
            label: 'See my score',
            run: (ctx) => {
              ctx.update((data) => {
                data.learn.best[lessonId] = Math.max(data.learn.best[lessonId] ?? 0, score);
              });
              return { replace: quizDone(lessonId, score, questions.length) };
            },
          }
        : { label: 'Next question', run: () => ({ replace: quizQuestion(lessonId, questions, index + 1, score) }) },
    ],
  };
};

const quizDone = (lessonId, score, total) => () => ({
  body: [
    `Quiz complete: ${score}/${total}`,
    score === total
      ? 'Perfect score! Well done.'
      : score >= Math.ceil(total / 2)
        ? 'Good work. Read the lesson again to fill the gaps.'
        : 'Keep going. Read the lesson and try again.',
  ].join('\n'),
  items: [
    { label: 'Retake the quiz', run: () => ({ replace: quizQuestion(lessonId, shuffledQuiz(findLesson(lessonId)), 0, 0) }) },
    {
      label: 'Read the lesson',
      run: (ctx) => {
        markRead(ctx, lessonId);
        return lessonView(lessonId);
      },
    },
  ],
});

function progressScreen(ctx) {
  const { read, best } = ctx.data.learn;
  const done = Object.keys(best);
  const totalQuestions = done.reduce((total, id) => total + (findLesson(id)?.quiz.length ?? 0), 0);
  const correct = done.reduce((total, id) => total + best[id], 0);
  return {
    body: [
      'My progress',
      `Lessons read: ${read.length}/${LESSONS.length}`,
      `Quizzes done: ${done.length}/${LESSONS.length}`,
      totalQuestions ? `Best scores: ${Math.round((correct / totalQuestions) * 100)}% correct` : 'No quizzes taken yet.',
      `Messages flagged by Scam check: ${ctx.data.shieldFlagged}`,
    ].join('\n'),
  };
}

// ---------------------------------------------------------------- Alerts

function alertsScreen(ctx) {
  const alerts = computeAlerts(ctx.data);
  return {
    body: alerts.length ? ['Needs attention:', ...alerts.map((alert) => `- ${alert}`)].join('\n') : "You're all caught up. No alerts.",
    items: alerts.length ? [{ label: 'My budgets', to: budgetsList }] : [],
  };
}

// ---------------------------------------------------------------- Settings

function settingsMenu(ctx) {
  return {
    body: 'Settings',
    items: [
      { label: 'My account', to: accountMenu },
      { label: `Currency: ${ctx.data.currency}`, to: currencyMenu },
      { label: 'Load demo data', to: resetConfirm('demo') },
      { label: 'Clear my data', to: resetConfirm('empty') },
      { label: 'About FinSmart USSD', to: aboutScreen },
    ],
  };
}

// My account

function accountMenu(ctx) {
  const account = findAccount(ctx.phone);
  if (!account) return { body: 'Account not found.' };
  return {
    body: [`Name: ${account.name}`, `Number: ${formatPhone(account.phone)}`, `Member since ${formatDay(account.createdAt)}`].join('\n'),
    items: [
      { label: 'Change PIN', to: changePinCurrent },
      {
        label: 'Log out',
        run: () => {
          forgetDevice();
          ctx.signOut();
          return { end: `You are logged out. Dial ${USSD_CODE} to log in again.` };
        },
      },
      { label: 'Delete account', to: deleteAccountConfirm },
    ],
  };
}

function changePinCurrent(ctx) {
  return {
    body: 'Enter your current PIN:',
    keyboard: 'pin',
    onInput: (value) => {
      const result = verifyPin(ctx.phone, value);
      if (result.ok) return { replace: changePinNew };
      if (result.locked) {
        ctx.signOut();
        return { end: `Too many wrong PINs. Your account is locked for ${result.locked} minutes.` };
      }
      return { error: `Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.` };
    },
  };
}

function changePinNew() {
  return {
    body: `Enter a new ${PIN_LENGTH}-digit PIN:`,
    keyboard: 'pin',
    onInput: (value) => {
      const problem = pinProblem(value);
      return problem ? { error: problem } : { replace: changePinConfirm(value) };
    },
  };
}

const changePinConfirm = (pin) => (ctx) => ({
  body: 'Enter the new PIN again:',
  keyboard: 'pin',
  onInput: (value) => {
    if (value !== pin) return { replace: changePinNew, error: "The PINs don't match. Try again." };
    changePin(ctx.phone, pin);
    return { back: true, notice: 'Your PIN has been changed.' };
  },
});

function deleteAccountConfirm(ctx) {
  return {
    body: 'Delete your account and all its data from this phone? Enter your PIN to confirm:',
    keyboard: 'pin',
    onInput: (value) => {
      const result = verifyPin(ctx.phone, value);
      if (result.ok) {
        deleteAccount(ctx.phone);
        ctx.signOut();
        return { end: `Your account has been deleted. Dial ${USSD_CODE} to create a new one.` };
      }
      if (result.locked) {
        ctx.signOut();
        return { end: `Too many wrong PINs. Your account is locked for ${result.locked} minutes.` };
      }
      return { error: `Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.` };
    },
  };
}

function currencyMenu() {
  return {
    body: 'Currency for new budgets and income:',
    items: CURRENCY_OPTIONS.map((option) => ({
      label: `${option.code} ${option.name}`,
      run: (ctx) => {
        ctx.update((data) => {
          data.currency = option.code;
        });
        return { back: true, notice: `Currency set to ${option.code}.` };
      },
    })),
  };
}

const resetConfirm = (kind) => () => ({
  body:
    kind === 'demo'
      ? 'Replace your budgets and income with sample data to explore FinSmart?'
      : 'Delete all your budgets, income and progress? Your account stays.',
  items: [
    {
      label: 'Yes',
      run: (ctx) => {
        ctx.replace(kind === 'demo' ? demoData() : emptyData(ctx.data.currency));
        return { home: true, notice: kind === 'demo' ? 'Sample data loaded.' : 'Your data was cleared.' };
      },
    },
    { label: 'No', run: () => ({ back: true }) },
  ],
});

function aboutScreen() {
  return {
    body: 'FinSmart USSD is a free simulation of the FinSmart app. Your account and data stay on this phone. No AI is used: every answer follows FinSmart rules.',
  };
}
