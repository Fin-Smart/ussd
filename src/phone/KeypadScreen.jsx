import { useRef } from 'react';

import { DeleteIcon, PhoneIcon } from './icons';

const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
];

const HOLD_MS = 550;
const REPEAT_MS = 90;
const MAX_SHOWN = 17;

function displaySize(length) {
  if (length <= 11) return 'xl';
  if (length <= 14) return 'lg';
  return 'md';
}

/** Touch-and-hold works like iOS: 0 turns into +, delete keeps deleting. */
export function KeypadScreen({ digits, flashKey, onKey, onReplaceLast, onDelete, onCall }) {
  const holdTimer = useRef(null);
  const repeatTimer = useRef(null);

  const stopHold = () => {
    clearTimeout(holdTimer.current);
    clearInterval(repeatTimer.current);
  };

  const pressKey = (event, key) => {
    event.preventDefault();
    onKey(key);
    if (key === '0') holdTimer.current = setTimeout(() => onReplaceLast('+'), HOLD_MS);
  };

  const pressDelete = (event) => {
    event.preventDefault();
    onDelete();
    holdTimer.current = setTimeout(() => {
      repeatTimer.current = setInterval(onDelete, REPEAT_MS);
    }, HOLD_MS);
  };

  const shown = digits.length > MAX_SHOWN ? `…${digits.slice(-(MAX_SHOWN - 1))}` : digits;

  return (
    <div className="keypad-screen">
      <div className="dial-display">
        <div className={`dial-number dial-${displaySize(digits.length)}`} aria-live="polite">
          {shown}
        </div>
        <button type="button" className="add-number" style={{ visibility: digits ? 'visible' : 'hidden' }} tabIndex={-1}>
          Add Number
        </button>
      </div>

      <div className="keypad-grid">
        {KEYS.map(([key, letters]) => (
          <button
            key={key}
            type="button"
            className={`key key-${key === '*' ? 'star' : key === '#' ? 'hash' : 'digit'}${flashKey === key ? ' pressed' : ''}`}
            aria-label={key}
            onPointerDown={(event) => pressKey(event, key)}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onContextMenu={(event) => event.preventDefault()}>
            <span className="key-digit">{key}</span>
            {key !== '*' && key !== '#' ? (
              <span className={`key-letters${key === '0' ? ' key-plus' : ''}`}>{letters}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="keypad-actions">
        <span />
        <button type="button" className="call-button" aria-label="Call" onClick={onCall}>
          <PhoneIcon width="36" height="36" />
        </button>
        {digits ? (
          <button
            type="button"
            className="delete-button"
            aria-label="Delete"
            onPointerDown={pressDelete}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onContextMenu={(event) => event.preventDefault()}>
            <DeleteIcon width="31" height="25" />
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
