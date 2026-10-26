import { useEffect, useEffectEvent, useState } from 'react';

import { AddPersonIcon, KeypadIcon, MicOffIcon, PhoneIcon, SpeakerIcon, VideoIcon } from './icons';

const FAIL_AFTER_MS = 4000;
const CLOSE_AFTER_FAIL_MS = 1600;

/** Normal numbers can't really be called from a simulation, so the call fails like it would with no airtime. */
export function CallScreen({ number, onEnd }) {
  const [failed, setFailed] = useState(false);
  const end = useEffectEvent(onEnd);

  useEffect(() => {
    const failTimer = setTimeout(() => setFailed(true), FAIL_AFTER_MS);
    const closeTimer = setTimeout(() => end(), FAIL_AFTER_MS + CLOSE_AFTER_FAIL_MS);
    return () => {
      clearTimeout(failTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  const buttons = [
    { label: 'Speaker', Icon: SpeakerIcon },
    { label: 'FaceTime', Icon: VideoIcon },
    { label: 'Mute', Icon: MicOffIcon },
    { label: 'Add', Icon: AddPersonIcon },
    { label: 'End', Icon: PhoneIcon, end: true },
    { label: 'Keypad', Icon: KeypadIcon },
  ];

  return (
    <div className="call-screen">
      <div className="call-top">
        <div className="call-name">{number}</div>
        <div className="call-status">{failed ? 'Call Failed' : 'calling mobile...'}</div>
      </div>
      <div className="call-grid">
        {buttons.map(({ label, Icon, end: isEnd }) => (
          <div key={label} className="call-cell">
            <button
              type="button"
              className={`call-btn${isEnd ? ' call-end' : ''}`}
              aria-label={label}
              onClick={isEnd ? onEnd : undefined}>
              <Icon width={isEnd ? 34 : 28} height={isEnd ? 34 : 28} />
            </button>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
