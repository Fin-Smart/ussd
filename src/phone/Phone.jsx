import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { createStore } from '../finsmart/store';
import { takeDialParam } from '../pwa';
import { createSession } from '../ussd/engine';
import { GOODBYE, mainMenu } from '../ussd/menus';
import { CallScreen } from './CallScreen';
import { KeypadScreen } from './KeypadScreen';
import { ContactsScreen, FavouritesScreen, RecentsScreen, VoicemailScreen } from './ListScreens';
import { addRecent, loadRecents } from './recents';
import { StatusBar } from './StatusBar';
import { TabBar } from './TabBar';
import { playTone } from './tones';
import { UssdAlert } from './UssdAlert';

const FINSMART_CODE = /^\*120\*3762((?:\*\d+)*)#$/;
const NETWORK_DELAY_MS = 1300;
const REPLY_DELAY_MS = 650;
const FLASH_MS = 120;
const DIAL_CHARS = /^[0-9*#+]$/;

const SHORTCUT_DELAY_MS = 400;

const isUssd = (value) => /^[*#]/.test(value) && value.endsWith('#');

/** A code from a home screen shortcut, shown on the keypad and dialled right after launch. */
const SHORTCUT_CODE = (() => {
  const code = takeDialParam();
  return code && /^[0-9*#+]+$/.test(code) ? code : null;
})();

export function Phone({ framed }) {
  const [store] = useState(createStore);
  const [tab, setTab] = useState('keypad');
  const [digits, setDigits] = useState(SHORTCUT_CODE ?? '');
  const [flashKey, setFlashKey] = useState(null);
  const [recents, setRecents] = useState(loadRecents);
  const [ussd, setUssd] = useState(null);
  const [call, setCall] = useState(null);
  const session = useRef(null);
  const timer = useRef(null);
  const flashTimer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(flashTimer.current);
    },
    [],
  );

  const later = (run, delay) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(run, delay);
  };

  const show = (view) => {
    if (view.done) session.current = null;
    setUssd((current) => ({
      status: view.done ? 'final' : 'reply',
      text: view.text,
      keyboard: view.keyboard,
      screen: (current?.screen ?? 0) + 1,
    }));
  };

  const startUssd = (code) => {
    session.current = null;
    setUssd((current) => ({ status: 'running', screen: (current?.screen ?? 0) + 1 }));
    later(() => {
      const match = code.match(FINSMART_CODE);
      if (!match) {
        setUssd((current) => ({
          status: 'final',
          title: 'Error performing request',
          text: 'Unknown error',
          screen: (current?.screen ?? 0) + 1,
        }));
        return;
      }
      // Codes like *120*3762*1# jump straight into a menu, as real USSD services allow.
      const created = createSession({ root: mainMenu, ctx: store, goodbye: GOODBYE });
      let view = created.view();
      for (const step of match[1].split('*').filter(Boolean)) {
        if (view.done) break;
        view = created.reply(step);
      }
      session.current = created;
      show(view);
    }, NETWORK_DELAY_MS);
  };

  const reply = (value) => {
    const active = session.current;
    if (!active) return;
    setUssd((current) => ({ ...current, status: 'running' }));
    later(() => show(active.reply(value)), REPLY_DELAY_MS);
  };

  const dismiss = () => {
    clearTimeout(timer.current);
    session.current = null;
    setUssd(null);
  };

  const dial = (number = digits) => {
    if (!number) {
      // Like iOS, pressing call on an empty keypad brings back the last number.
      if (recents[0]) setDigits(recents[0].number);
      return;
    }
    const ussdCode = isUssd(number);
    setRecents((current) => addRecent(current, number, ussdCode ? 'ussd' : 'call'));
    if (ussdCode) startUssd(number);
    else setCall({ number });
  };

  const dialFromList = (number) => {
    setTab('keypad');
    setDigits(number);
    dial(number);
  };

  const pressKey = (key) => {
    playTone(key);
    setDigits((current) => (current.length < 40 ? current + key : current));
  };

  const flash = (key) => {
    setFlashKey(key);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashKey(null), FLASH_MS);
  };

  const keypadActive = tab === 'keypad' && !ussd && !call;

  const onKeyDown = useEffectEvent((event) => {
    if (!keypadActive || event.metaKey || event.ctrlKey || event.altKey) return;
    if (DIAL_CHARS.test(event.key)) {
      event.preventDefault();
      pressKey(event.key);
      flash(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      setDigits((current) => current.slice(0, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      dial();
    }
  });

  const onPaste = useEffectEvent((event) => {
    if (!keypadActive) return;
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/[^0-9*#+]/g, '');
    if (pasted) setDigits((current) => (current + pasted).slice(0, 40));
  });

  const dialShortcut = useEffectEvent(() => dial(SHORTCUT_CODE));

  useEffect(() => {
    if (!SHORTCUT_CODE) return;
    const shortcutTimer = setTimeout(dialShortcut, SHORTCUT_DELAY_MS);
    return () => clearTimeout(shortcutTimer);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, []);

  return (
    <div className={`phone ${framed ? 'framed' : 'fullscreen'}`}>
      {framed ? (
        <>
          <div className="dynamic-island" />
          <StatusBar light={Boolean(call)} />
        </>
      ) : null}

      <main className="phone-content" inert={Boolean(ussd || call)}>
        {tab === 'keypad' ? (
          <KeypadScreen
            digits={digits}
            flashKey={flashKey}
            onKey={pressKey}
            onReplaceLast={(key) => setDigits((current) => current.slice(0, -1) + key)}
            onDelete={() => setDigits((current) => current.slice(0, -1))}
            onCall={() => dial()}
          />
        ) : null}
        {tab === 'favourites' ? <FavouritesScreen onDial={dialFromList} /> : null}
        {tab === 'recents' ? <RecentsScreen recents={recents} onDial={dialFromList} /> : null}
        {tab === 'contacts' ? <ContactsScreen onDial={dialFromList} /> : null}
        {tab === 'voicemail' ? <VoicemailScreen /> : null}
      </main>

      <TabBar active={tab} onChange={setTab} inert={Boolean(ussd || call)} />

      {call ? <CallScreen number={call.number} onEnd={() => setCall(null)} /> : null}

      {ussd ? (
        <UssdAlert key={ussd.screen} state={ussd} showPad={framed && ussd.keyboard !== 'text'} onReply={reply} onDismiss={dismiss} />
      ) : null}

      {framed ? <div className={`home-indicator${call ? ' light' : ''}`} /> : null}
    </div>
  );
}
