import { useSyncExternalStore } from 'react';

import { Phone } from './phone/Phone';
import { USSD_CODE } from './ussd/menus';
import './App.css';
import './phone/phone.css';

const DEVICE_WIDTH = 421;
const DEVICE_HEIGHT = 880;
const MARGIN = 40;

function subscribeResize(onChange) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

/** Real phones get the Phone app full screen; bigger screens get it inside an iPhone frame. */
const isFramed = () => window.innerWidth >= 560 && window.innerHeight >= 520;
const deviceScale = () =>
  Math.min(1, (window.innerHeight - MARGIN) / DEVICE_HEIGHT, (window.innerWidth - MARGIN) / DEVICE_WIDTH);

const SHORTCUTS = [
  ['*120*3762#', 'Main menu'],
  ['*120*3762*1#', 'My budgets'],
  ['*120*3762*2#', 'Add expense'],
  ['*120*3762*5#', 'Scam check'],
  ['*120*3762*6#', 'Learn & quiz'],
];

export default function App() {
  const framed = useSyncExternalStore(subscribeResize, isFramed);
  const scale = useSyncExternalStore(subscribeResize, deviceScale);

  // One tree for both layouts, so resizing across the breakpoint keeps the call and keypad state.
  return (
    <div className={`stage${framed ? '' : ' stage-full'}`}>
      <div className="device" style={framed ? { '--scale': scale } : undefined}>
        {framed ? (
          <>
            <span className="device-button action" />
            <span className="device-button volume-up" />
            <span className="device-button volume-down" />
            <span className="device-button power" />
          </>
        ) : null}
        <div className="device-screen">
          <Phone framed={framed} />
        </div>
      </div>

      {framed ? <Guide /> : null}
    </div>
  );
}

function Guide() {
  return (
    <aside className="guide">
      <h1>FinSmart USSD</h1>
      <p>
        A free simulation of FinSmart over USSD. Dial <strong>{USSD_CODE}</strong> on the keypad and press the green call
        button.
      </p>
      <h2>Shortcuts</h2>
      <ul>
        {SHORTCUTS.map(([code, label]) => (
          <li key={code}>
            <code>{code}</code>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <h2>Tips</h2>
      <ul className="tips">
        <li>Type with your keyboard. Enter calls, Esc dismisses.</li>
        <li>Reply 0 to go back, 00 for the main menu, 98 for more.</li>
        <li>Use * as the decimal point, e.g. 150*50.</li>
        <li>Your data stays in this browser.</li>
      </ul>
    </aside>
  );
}
