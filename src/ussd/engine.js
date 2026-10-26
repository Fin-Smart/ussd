/**
 * A tiny USSD session runner.
 *
 * A node is `(ctx) => screen`, re-run on every render so screens always show current data.
 * A screen is { body, items?, onInput?, footer?, keyboard?, end? }:
 * - items: [{ label, to?: node, run?: (ctx) => result }], chosen by number.
 * - onInput(value, ctx) => result, for free replies such as amounts or names.
 * - end: true closes the session with `body`.
 *
 * A result is a node (opened on top) or an object combining:
 * { push, replace, reset (node or nodes after the main menu), back, home, end, notice, error }.
 *
 * Replies "0" (back), "00" (main menu) and "98" (next page) work on every screen.
 */
export const MAX_CHARS = 182;
const LINE_CHUNK = 120;
const MORE = '98. More';

function splitWords(text) {
  const parts = [];
  let current = '';
  for (const word of text.split(' ')) {
    if (current && current.length + 1 + word.length > LINE_CHUNK) {
      parts.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * Long lines are cut at sentence ends (or words, for very long sentences) so pages can break
 * between them. Pieces after the first are "soft": on the same page they rejoin with a space.
 */
function splitLong(line) {
  if (line.length <= LINE_CHUNK) return [{ text: line, soft: false }];
  return line
    .split(/(?<=[.!?:])\s+/)
    .flatMap(splitWords)
    .map((text, index) => ({ text, soft: index > 0 }));
}

function paginate(pieces, footer) {
  const reserved = (footer ? footer.length + 1 : 0) + MORE.length + 1;
  const pages = [];
  let page = [];
  let length = 0;

  for (const piece of pieces) {
    const added = (page.length ? 1 : 0) + piece.text.length;
    if (page.length && length + added > MAX_CHARS - reserved) {
      pages.push(page);
      page = [];
      length = 0;
    }
    length += (page.length ? 1 : 0) + piece.text.length;
    page.push(piece);
  }
  pages.push(page);

  return pages.map((page, index) => {
    const text = page.map((piece, position) => (position === 0 ? '' : piece.soft ? ' ' : '\n') + piece.text).join('');
    return [text, index < pages.length - 1 ? MORE : null, footer || null].filter(Boolean).join('\n');
  });
}

export function createSession({ root, ctx, goodbye }) {
  let stack = [root];
  let page = 0;
  let notice = null;
  let ended = null;

  const build = () => {
    const screen = stack[stack.length - 1](ctx);
    if (screen.end) return { screen, pages: [screen.body] };

    const lines = [];
    if (notice) lines.push(...splitLong(notice));
    for (const line of (screen.body ?? '').split('\n')) if (line) lines.push(...splitLong(line));
    (screen.items ?? []).forEach((item, index) => lines.push({ text: `${index + 1}. ${item.label}`, soft: false }));

    const depth = stack.length;
    const footer = screen.footer ?? (depth === 1 ? '0. Exit' : depth > 2 ? '0. Back 00. Home' : '0. Back');
    return { screen, pages: paginate(lines, footer) };
  };

  const view = () => {
    if (ended) return { text: ended, done: true, keyboard: 'numeric' };
    const { screen, pages } = build();
    if (screen.end) {
      ended = screen.body;
      return { text: ended, done: true, keyboard: 'numeric' };
    }
    page = Math.min(page, pages.length - 1);
    return { text: pages[page], done: false, keyboard: screen.keyboard ?? 'numeric' };
  };

  const apply = (result) => {
    page = 0;
    if (!result) return;
    if (typeof result === 'function') {
      stack.push(result);
      return;
    }
    if (result.back && stack.length > 1) stack.pop();
    if (result.home) stack = [root];
    if (result.reset) stack = [root, ...[result.reset].flat()];
    if (result.replace) stack[stack.length - 1] = result.replace;
    if (result.push) stack.push(result.push);
    if (result.end) ended = result.end;
    if (result.notice || result.error) notice = result.notice ?? result.error;
  };

  const reply = (raw) => {
    if (ended) return view();
    const input = raw.trim();
    const { screen, pages } = build();
    notice = null;

    if (input === '98' && page < pages.length - 1) {
      page += 1;
      return view();
    }
    if (input === '0') {
      if (page > 0) {
        page -= 1;
      } else if (stack.length === 1) {
        ended = goodbye;
      } else {
        stack.pop();
      }
      return view();
    }
    if (input === '00') {
      stack = [root];
      page = 0;
      return view();
    }

    const items = screen.items ?? [];
    if (/^\d+$/.test(input)) {
      const choice = Number(input);
      if (choice >= 1 && choice <= items.length) {
        const item = items[choice - 1];
        apply(item.run ? item.run(ctx) : item.to);
        return view();
      }
    }

    if (screen.onInput) {
      apply(input ? screen.onInput(input, ctx) : { error: 'Please enter a reply.' });
      return view();
    }

    apply({ error: 'Invalid choice. Try again.' });
    return view();
  };

  return { view, reply };
}
