import { useSyncExternalStore } from 'react';

import { BatteryIcon, SignalIcon, WifiIcon } from './icons';

const clockFormat = new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });

function subscribeClock(onChange) {
  const timer = setInterval(onChange, 10_000);
  return () => clearInterval(timer);
}

const currentTime = () => clockFormat.format(Date.now());

export function StatusBar({ light = false }) {
  const time = useSyncExternalStore(subscribeClock, currentTime);
  return (
    <div className={`status-bar${light ? ' status-bar-light' : ''}`}>
      <div className="status-side">
        <span className="status-time">{time}</span>
      </div>
      <div className="status-side status-icons">
        <SignalIcon width="18" height="12" />
        <WifiIcon width="16" height="12" />
        <BatteryIcon width="27" height="13" />
      </div>
    </div>
  );
}
