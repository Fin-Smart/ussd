/** SF Symbol look-alikes used by the Phone app. All are 24x24 and use currentColor. */

export function StarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2.6c.4 0 .7.2.9.6l2.4 4.9 5.4.8c.9.1 1.2 1.2.6 1.8l-3.9 3.8.9 5.4c.2.9-.8 1.6-1.6 1.1L12 18.5l-4.8 2.5c-.8.4-1.7-.2-1.6-1.1l.9-5.4-3.9-3.8c-.6-.6-.3-1.7.6-1.8l5.4-.8 2.4-4.9c.3-.4.6-.6 1-.6z"
      />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <mask id="clock-cut">
        <rect width="24" height="24" fill="#fff" />
        <path d="M12 6.4V12.4l3.6 2.2" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </mask>
      <circle cx="12" cy="12" r="10" fill="currentColor" mask="url(#clock-cut)" />
    </svg>
  );
}

export function PersonCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <mask id="person-cut">
        <rect width="24" height="24" fill="#fff" />
        <circle cx="12" cy="9.6" r="3.7" fill="#000" />
        <path d="M5.4 18.6c1.3-2.5 3.8-4 6.6-4s5.3 1.5 6.6 4c-1.7 1.6-4 2.6-6.6 2.6s-4.9-1-6.6-2.6z" fill="#000" />
      </mask>
      <circle cx="12" cy="12" r="10" fill="currentColor" mask="url(#person-cut)" />
    </svg>
  );
}

export function KeypadIcon(props) {
  const dots = [];
  for (const y of [4.6, 12, 19.4]) for (const x of [4.6, 12, 19.4]) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="2.7" />);
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      {dots}
    </svg>
  );
}

export function VoicemailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.3" {...props}>
      <circle cx="6.4" cy="12" r="4.1" />
      <circle cx="17.6" cy="12" r="4.1" />
      <path d="M6.4 16.1h11.2" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M6.9 2.3c.6-.2 1.3 0 1.7.6l2 3c.4.6.3 1.4-.2 1.9L9 9.2c-.3.3-.4.8-.2 1.2.9 1.7 2.3 3.3 4 4.4.4.2.9.2 1.2-.1l1.4-1.3c.5-.5 1.3-.6 1.9-.2l3 2c.6.4.8 1.1.6 1.7l-.6 1.8c-.4 1.3-1.7 2.2-3.1 2-3.6-.5-7-2.3-9.7-5S3.1 9.6 2.6 6c-.2-1.4.7-2.7 2-3.1l2.3-.6z"
      />
    </svg>
  );
}

export function DeleteIcon(props) {
  return (
    <svg viewBox="0 0 30 24" aria-hidden="true" {...props}>
      <mask id="delete-cut">
        <rect width="30" height="24" fill="#fff" />
        <path d="M13.6 8.2l7.6 7.6M21.2 8.2l-7.6 7.6" stroke="#000" strokeWidth="2.1" strokeLinecap="round" />
      </mask>
      <path
        fill="currentColor"
        mask="url(#delete-cut)"
        d="M10.3 3h15.2C27.4 3 29 4.6 29 6.5v11c0 1.9-1.6 3.5-3.5 3.5H10.3c-1 0-1.9-.4-2.6-1.1L1.6 13.5c-.8-.9-.8-2.1 0-3L7.7 4.1C8.4 3.4 9.3 3 10.3 3z"
      />
    </svg>
  );
}

export function InfoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 10.8v5.6" strokeLinecap="round" strokeWidth="1.9" />
      <circle cx="12" cy="7.6" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L20 20" />
    </svg>
  );
}

export function SpeakerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z" fill="currentColor" strokeLinejoin="round" />
      <path d="M15.4 9.2a4 4 0 010 5.6M18 6.7a7.6 7.6 0 010 10.6" />
    </svg>
  );
}

export function VideoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <rect x="2.5" y="6" width="13" height="12" rx="3" />
      <path d="M16.8 10.6l4-2.6c.5-.3 1.2 0 1.2.6v6.8c0 .6-.7.9-1.2.6l-4-2.6z" />
    </svg>
  );
}

export function MicOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M6 11a6 6 0 0012 0M12 17v3.5M4 4l16 16" />
    </svg>
  );
}

export function AddPersonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <circle cx="9.5" cy="8" r="3.8" />
      <path d="M2.5 19.2c.6-3.4 3.5-5.6 7-5.6s6.4 2.2 7 5.6c.1.5-.3.8-.8.8H3.3c-.5 0-.9-.3-.8-.8z" />
      <path d="M19 7.5v6M16 10.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SignalIcon(props) {
  return (
    <svg viewBox="0 0 18 12" aria-hidden="true" fill="currentColor" {...props}>
      <rect x="0" y="8" width="3" height="4" rx="0.8" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
      <rect x="10" y="3" width="3" height="9" rx="0.8" />
      <rect x="15" y="0" width="3" height="12" rx="0.8" />
    </svg>
  );
}

export function WifiIcon(props) {
  return (
    <svg viewBox="0 0 16 12" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 2.3c2.4 0 4.6.9 6.3 2.5.2.2.5.2.7 0l.8-.8c.2-.2.2-.5 0-.7C13.7 1.2 10.9 0 8 0S2.3 1.2.2 3.3c-.2.2-.2.5 0 .7l.8.8c.2.2.5.2.7 0C3.4 3.2 5.6 2.3 8 2.3z" />
      <path d="M8 6c1.4 0 2.7.5 3.7 1.4.2.2.5.2.7 0l.8-.8c.2-.2.2-.5 0-.7C11.8 4.6 10 3.8 8 3.8s-3.8.8-5.2 2.1c-.2.2-.2.5 0 .7l.8.8c.2.2.5.2.7 0C5.3 6.5 6.6 6 8 6z" />
      <path d="M10.4 9.3c.2-.2.2-.5 0-.7C9.7 8 8.9 7.7 8 7.7s-1.7.3-2.4.9c-.2.2-.2.5 0 .7l2 2c.2.2.5.2.7 0z" />
    </svg>
  );
}

export function BatteryIcon(props) {
  return (
    <svg viewBox="0 0 27 13" aria-hidden="true" {...props}>
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity="0.4" />
      <rect x="2" y="2" width="17" height="9" rx="2.5" fill="currentColor" />
      <path d="M25 4.4v4.2c.8-.3 1.4-1.2 1.4-2.1s-.6-1.8-1.4-2.1z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}
