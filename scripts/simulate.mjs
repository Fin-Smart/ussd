// Walks through USSD sessions in Node and prints every screen, flagging any over 182 characters.
// Usage: node scripts/simulate.mjs
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { createSession, MAX_CHARS } = await server.ssrLoadModule('/src/ussd/engine.js');
  const { mainMenu, GOODBYE } = await server.ssrLoadModule('/src/ussd/menus.js');
  const { demoData } = await server.ssrLoadModule('/src/finsmart/store.js');

  let data = demoData();
  const ctx = {
    get data() {
      return data;
    },
    update(mutate) {
      const next = structuredClone(data);
      mutate(next);
      data = next;
    },
    replace(next) {
      data = next;
    },
  };

  let problems = 0;
  const run = (title, replies) => {
    console.log(`\n==================== ${title}`);
    const session = createSession({ root: mainMenu, ctx, goodbye: GOODBYE });
    const print = (view, input) => {
      const flag = view.text.length > MAX_CHARS ? `  <-- TOO LONG (${view.text.length})` : '';
      if (flag) problems += 1;
      console.log(`${input === undefined ? '' : `> ${input}\n`}${view.text}\n[${view.text.length} chars${view.done ? ', ended' : ''}]${flag}\n`);
    };
    print(session.view());
    for (const input of replies) print(session.reply(input), input);
  };

  run('Main menu and budgets', ['1', '1', '1', '0', '4', '2', '1', '0', '5']);
  run('Add expense flow', ['2', '1', '2', '350*50', 'Checkers', '1', '2']);
  run('Income', ['3', '1', '20000']);
  run('New budget with suggested split', ['4', 'Baby shower', '2', '1', '31122026', '4', '3000', '1', '1', '1']);
  run('Delete budget and empty data', ['1', '4', '98', '7', '1', '0', '8', '3', '1']);
  run('Empty data', ['1', '2', '3']);
  run('New budget own categories', ['4', 'Gym', '1', '2', '500', '2', 'Membership', '400', '2']);
  run('Scam examples', ['5', '2', '1', '1', '0', '2', '2', '1', '0', '2', '4', '1']);
  run('Scam typed', ['5', '1', 'Your SASSA grant is ready. Click bit.ly/sassa-pay and enter your ID number', '1']);
  run('Learn', ['6', '1', '1', '98', '98', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1']);
  run('Alerts and settings', ['7', '0', '8', '1', '2', '0', '4', '00', '0']);
  run('Paging and errors', ['9', '1', '98', '98', '0', 'abc']);

  console.log(problems ? `\n${problems} screen(s) over ${MAX_CHARS} characters.` : `\nAll screens within ${MAX_CHARS} characters.`);
} finally {
  await server.close();
}
