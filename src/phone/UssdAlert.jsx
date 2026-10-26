import { useEffect, useEffectEvent, useState } from 'react';

import { DeleteIcon } from './icons';

const PAD_KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
];

function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 40 40" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <rect
          key={index}
          x="18.5"
          y="4"
          width="3"
          height="9"
          rx="1.5"
          fill="currentColor"
          opacity={0.25 + (index / 8) * 0.75}
          transform={`rotate(${index * 45} 20 20)`}
        />
      ))}
    </svg>
  );
}

/** The iOS phone-pad keyboard, drawn inside the frame because a computer has no on-screen keyboard. */
function PhonePad({ onKey, onDelete }) {
  const keep = (event) => event.preventDefault();
  return (
    <div className="phone-pad" onPointerDown={keep}>
      {PAD_KEYS.map(([digit, letters]) => (
        <button key={digit} type="button" className="pad-key" onClick={() => onKey(digit)}>
          <span className="pad-digit">{digit}</span>
          <span className="pad-letters">{letters}</span>
        </button>
      ))}
      <button type="button" className="pad-key pad-plain" onClick={() => onKey('*')} aria-label="Star">
        <span className="pad-symbols">+ * #</span>
      </button>
      <button type="button" className="pad-key" onClick={() => onKey('0')}>
        <span className="pad-digit">0</span>
      </button>
      <button type="button" className="pad-key pad-plain" onClick={onDelete} aria-label="Delete">
        <DeleteIcon width="27" height="22" />
      </button>
    </div>
  );
}

/**
 * The system alert iOS shows for USSD: "running" while the network answers, then the menu text
 * with a reply field (Dismiss / Reply), or just Dismiss when the session has ended.
 */
export function UssdAlert({ state, showPad, onReply, onDismiss }) {
  const [value, setValue] = useState('');
  const running = state.status === 'running';
  const replying = state.status === 'reply';

  const onKeyDown = useEffectEvent((event) => {
    if (event.key === 'Escape') onDismiss();
  });

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    if (value.trim()) onReply(value);
  };

  return (
    <div className={`ussd-layer${showPad && replying ? ' with-pad' : ''}`}>
      <div className="ussd-center">
        <div className="ussd-alert" role="alertdialog" aria-modal="true" aria-label="USSD">
          {running ? (
            <div className="ussd-running">
              <Spinner />
              <p>{state.text ? 'Sending...' : 'USSD code running...'}</p>
            </div>
          ) : (
            <form id="ussd-form" onSubmit={submit}>
              {state.title ? <h2 className="ussd-title">{state.title}</h2> : null}
              <p className="ussd-message">{state.text}</p>
              {replying ? (
                <input
                  className={`ussd-input${state.keyboard === 'pin' ? ' ussd-pin' : ''}`}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  autoFocus
                  inputMode={state.keyboard === 'text' ? 'text' : state.keyboard === 'pin' ? 'numeric' : 'tel'}
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={state.keyboard === 'text' ? 320 : 20}
                  aria-label="Reply"
                />
              ) : null}
            </form>
          )}

          <div className={`ussd-buttons${replying ? '' : ' single'}`}>
            {replying ? (
              <>
                <button type="button" onClick={onDismiss}>
                  Dismiss
                </button>
                <button type="submit" form="ussd-form" className="primary" disabled={!value.trim()}>
                  Reply
                </button>
              </>
            ) : (
              <button type="button" onClick={onDismiss}>
                {running ? 'Cancel' : 'Dismiss'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPad && replying ? (
        <PhonePad onKey={(key) => setValue((current) => current + key)} onDelete={() => setValue((current) => current.slice(0, -1))} />
      ) : null}
    </div>
  );
}
