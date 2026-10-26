/**
 * Fixed splits that stand in for Smart Coach's AI planner. They follow the same rules it is given:
 * practical categories, savings or an emergency fund for monthly budgets, and never more than the
 * money available.
 */
const TEMPLATES = {
  Household: [
    ['Rent', 30],
    ['Groceries', 20],
    ['Transport', 10],
    ['Electricity & water', 8],
    ['Airtime & data', 4],
    ['Debt repayments', 8],
    ['Savings', 10],
    ['Emergency fund', 5],
    ['Personal', 5],
  ],
  Personal: [
    ['Takeaways', 30],
    ['Outings', 25],
    ['Clothing', 20],
    ['Subscriptions', 15],
    ['Savings', 10],
  ],
  Holiday: [
    ['Travel', 35],
    ['Accommodation', 30],
    ['Food', 20],
    ['Activities', 10],
    ['Buffer', 5],
  ],
  Event: [
    ['Venue', 30],
    ['Food & drinks', 35],
    ['Decor', 10],
    ['Gifts', 10],
    ['Transport', 5],
    ['Buffer', 10],
  ],
  'Savings goal': [
    ['Emergency fund', 50],
    ['Goal savings', 40],
    ['Buffer', 10],
  ],
  Other: [
    ['Needs', 50],
    ['Wants', 30],
    ['Savings', 20],
  ],
};

/** Whole amounts, rounded down to tens for bigger budgets; what rounding leaves goes to the first category. */
export function suggestSplit(label, availableCents) {
  const template = TEMPLATES[label] ?? TEMPLATES.Other;
  const unitCents = availableCents >= 100_000 ? 1000 : 100;
  const categories = template.map(([name, percent]) => ({
    name,
    limitCents: Math.floor((availableCents * percent) / 100 / unitCents) * unitCents,
  }));
  const used = categories.reduce((total, item) => total + item.limitCents, 0);
  categories[0].limitCents += Math.max(availableCents - used, 0);
  return categories.filter((item) => item.limitCents > 0);
}
