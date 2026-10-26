export const INCOME_LABELS = {
  monthly: 'Monthly income',
  total: 'Money you have',
};

/**
 * Monthly budgets always draw on income. One-off budgets count until the month after they end,
 * and budgets in another currency can't be compared, so they're left out.
 */
export function countsAgainstIncome(budget, income, now = Date.now()) {
  if (budget.currency !== income.currency) return false;
  if (budget.kind === 'monthly') return true;
  const today = new Date(now);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  return (budget.endDate ?? budget.startDate ?? budget.createdAt) >= monthStart;
}

/** How much of the income budgets already use. `excludeBudgetId` leaves out the budget being edited. */
export function allocateIncome(income, budgets, excludeBudgetId) {
  const allocatedCents = budgets
    .filter((budget) => budget.id !== excludeBudgetId && countsAgainstIncome(budget, income))
    .reduce((total, budget) => total + budget.availableCents, 0);
  return { allocatedCents, freeCents: income.amountCents - allocatedCents };
}
