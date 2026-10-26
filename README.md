# FinSmart USSD simulator

A website that looks like the iOS 26 Phone app (Classic layout). Dial `*120*3762#` and press call to use FinSmart over USSD: budgets, expenses, mark as paid, income, new budgets, scam check, lessons and quizzes, alerts and settings. No AI and no network operator: every answer follows the FinSmart app's own rules, and data is saved in the browser.

## Run

```
npm install
npm run dev
```

Open the printed URL. On a computer the app sits in an iPhone frame; on a phone (open the Network URL on the same Wi-Fi) it fills the screen.

`npm run simulate` walks through USSD sessions in the terminal and checks every screen fits in 182 characters.

## Codes

| Code | Opens |
| --- | --- |
| `*120*3762#` | Main menu |
| `*120*3762*1#` | My budgets |
| `*120*3762*2#` | Add expense |
| `*120*3762*3#` | Income |
| `*120*3762*5#` | Scam check |
| `*120*3762*6#` | Learn & quiz |
| `*120*3762*7#` | Alerts |

In a session: `0` back, `00` main menu, `98` next page. Use `*` as the decimal point (`150*50`).

## Where things live

- `src/phone/` - the Phone app UI: keypad, tabs, USSD alert, call screen.
- `src/ussd/engine.js` - USSD session runner (paging, back, home, replies).
- `src/ussd/menus.js` - the FinSmart menus.
- `src/finsmart/` - logic copied from the FinSmart app: money, periods, income, budget totals, alerts, scam detector, plus the demo data, the fixed budget splits and the written lessons that replace AI.
