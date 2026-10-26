// Walks through USSD sessions in Node and prints every screen, flagging any over 182 characters.
// Usage: npm run simulate
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { createSession, MAX_CHARS } = await server.ssrLoadModule('/src/ussd/engine.js');
  const { GOODBYE } = await server.ssrLoadModule('/src/ussd/menus.js');
  const { startMenu } = await server.ssrLoadModule('/src/ussd/authMenus.js');
  const { createStore } = await server.ssrLoadModule('/src/finsmart/store.js');
  const { sha256 } = await server.ssrLoadModule('/src/finsmart/accounts.js');

  for (const sample of ['', 'abc', 'FinSmart PIN 48163', 'x'.repeat(200)]) {
    const expected = createHash('sha256').update(sample).digest('hex');
    if (sha256(sample) !== expected) throw new Error(`sha256 mismatch for "${sample.slice(0, 20)}"`);
  }
  console.log('sha256 matches Node crypto.');

  const ctx = createStore();
  let problems = 0;
  const run = (title, replies, steps = []) => {
    console.log(`\n==================== ${title}`);
    ctx.signOut();
    ctx.pendingSteps = steps;
    const session = createSession({ root: startMenu, ctx, goodbye: GOODBYE });
    const print = (view, input) => {
      const flag = view.text.length > MAX_CHARS ? `  <-- TOO LONG (${view.text.length})` : '';
      if (flag) problems += 1;
      console.log(`${input === undefined ? '' : `> ${input}\n`}${view.text}\n[${view.text.length} chars${view.done ? ', ended' : ''}]${flag}\n`);
    };
    print(session.view());
    for (const input of replies) print(session.reply(input), input);
  };

  run('First dial: create account', ['2', 'thabo', '0821234567', '11111', '12345', '48163', '48160', '48163', '48163', '1', '15000']);
  run('Fresh account has no budgets', ['48163', '1', '0', '7']);
  run('Create a budget with the suggested split', ['48163', '4', 'Groceries & home', '1', '1', '8000', '1', '1', '1']);
  run('Add an expense', ['48163', '2', '2', '350', 'Checkers', '1']);
  run('Shortcut *120*3762*1# after PIN', ['48163'], ['1']);
  run('Second account on the same phone', ['1', '0731112222', '1', 'Lerato', '0731112222', '27272', '27272', '3', '1']);
  run('Wrong PINs lock the first account', ['1', '0821234567', '11112', '22223', '33334']);
  run('Locked account after typing its number', ['1', '0821234567']);
  run('Account menu and logout', ['27272', '8', '1', '2']);
  run('After logout', []);
  run('Scam check and learn', ['1', '0731112222', '27272', '5', '2', '2', '1', '00', '6', '9']);
  run('Load demo data and clear it', ['27272', '8', '3', '1', '1', '00', '8', '4', '1', '1']);
  run('Lock the remembered account', ['11112', '22223', '33334']);
  run('Start screen while remembered account is locked', ['2']);

  console.log(problems ? `\n${problems} screen(s) over ${MAX_CHARS} characters.` : `\nAll screens within ${MAX_CHARS} characters.`);
} finally {
  await server.close();
}
