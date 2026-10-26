import { formatMoney } from './money';
import { activePeriod } from './period';

const NEAR_LIMIT = 0.9;
const MONTH_END_DAYS = 7;

/** Same totals as the app's BudgetsProvider, from the transactions inside the budget's active period. */
export function summarize(budget, allTransactions, now = Date.now()) {
  const period = activePeriod(budget, now);
  const transactions = allTransactions
    .filter((item) => item.budgetId === budget.id && item.date >= period.start && item.date < period.end)
    .sort((a, b) => b.date - a.date);

  const spentByCategory = {};
  const paid = new Set();
  let spentCents = 0;
  let receivedCents = 0;

  for (const transaction of transactions) {
    if (transaction.marksPaid && transaction.categoryId) paid.add(transaction.categoryId);
    if (transaction.direction === 'in') {
      receivedCents += transaction.amountCents;
      continue;
    }
    spentCents += transaction.amountCents;
    const key = transaction.categoryId ?? 'uncategorised';
    spentByCategory[key] = (spentByCategory[key] ?? 0) + transaction.amountCents;
  }

  return {
    budget,
    period,
    transactions,
    spentCents,
    receivedCents,
    remainingCents: budget.availableCents + receivedCents - spentCents,
    spentByCategory,
    paidCategoryIds: budget.categories.filter((category) => paid.has(category.id)).map((category) => category.id),
  };
}

export const summarizeAll = (data, now = Date.now()) => data.budgets.map((budget) => summarize(budget, data.transactions, now));

/** The home screen alerts from the app, minus Smart Coach tokens, which USSD doesn't use. */
export function computeAlerts(data, now = Date.now()) {
  const alerts = [];
  const today = new Date(now);
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const summaries = summarizeAll(data, now);

  for (const { budget, period, spentCents, receivedCents, remainingCents } of summaries) {
    const total = budget.availableCents + receivedCents;
    if (remainingCents < 0) {
      alerts.push(
        `${budget.name} is over budget by ${formatMoney(-remainingCents, budget.currency)} for ${period.label}.`,
      );
    } else if (total > 0 && spentCents / total >= NEAR_LIMIT) {
      alerts.push(`${budget.name} is almost used up. Only ${formatMoney(remainingCents, budget.currency)} left.`);
    }
  }

  if (data.shieldFlagged > 0) {
    alerts.push(
      `Scam check flagged ${data.shieldFlagged} ${data.shieldFlagged === 1 ? 'message' : 'messages'}. Don't reply, click or pay.`,
    );
  }

  const unpaid = summaries.reduce(
    (count, summary) => count + summary.budget.categories.length - summary.paidCategoryIds.length,
    0,
  );
  if (unpaid > 0 && daysLeft <= MONTH_END_DAYS) {
    alerts.push(
      `${unpaid} ${unpaid === 1 ? 'item' : 'items'} still to pay, ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left this month.`,
    );
  }

  if (!data.income) {
    alerts.push('Add your income to see how much is free to budget.');
  }

  return alerts;
}
