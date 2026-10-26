# FinSmart USSD simulator

A website that looks like the iOS 26 Phone app (Classic layout). Dial `*120*3762#` and press call to use FinSmart over USSD: budgets, expenses, mark as paid, income, new budgets, scam check, lessons and quizzes, alerts and settings. No AI and no network operator: every answer follows the FinSmart app's own rules, and data is saved in the browser.

## Accounts

The first dial offers **Create account**: first name, cellphone number and a 5-digit PIN (typed twice; repeated digits like 11111 and runs like 12345 are refused). Each account starts empty and has its own data. Like banking USSD, every dial asks for the PIN; the phone remembers the last account so only the PIN is needed. Three wrong PINs lock the account for 5 minutes.

Settings > My account changes the PIN, logs out or deletes the account. Settings > Load demo data fills the account with sample budgets for demos.

Accounts live in `localStorage` (`finsmart-ussd:accounts:v1`, data under `finsmart-ussd:data:<number>`). PINs are stored only as a salted, stretched SHA-256 hash. This is a simulation: anyone with the phone can clear browser storage, so don't treat it as real banking security. A forgotten PIN can't be recovered; "Forgot PIN" deletes that account from the phone so a new one can be made.

## Run

```
npm install
npm run dev
```

Open the printed URL. On a computer the app sits in an iPhone frame; on a phone (open the Network URL on the same Wi-Fi) it fills the screen.

`npm run simulate` walks through USSD sessions in the terminal and checks every screen fits in 182 characters.

## Install as an app (PWA)

The service worker only runs in production builds, so test the app version with:

```
npm run build
npm run preview -- --host
```

- Computer (Chrome or Edge): click **Install FinSmart USSD** in the side panel, or the install icon in the address bar.
- iPhone: open the site in Safari, tap Share, then **Add to Home Screen**.
- Android: open the site in Chrome, tap the menu, then **Install app**.

Phones only install and work offline over **HTTPS** (or `localhost`), so for phones deploy `dist/` to any HTTPS host, e.g. Firebase Hosting, Netlify or Vercel. Once installed it opens full screen and works offline. Long-press the icon for shortcuts to My budgets, Add expense and Scam check.

After a new deploy, the next launch picks up the update. If you change `public/sw.js`, bump the `v2` cache name in it.

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
