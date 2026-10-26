import { ClockIcon, KeypadIcon, PersonCircleIcon, StarIcon, VoicemailIcon } from './icons';

const TABS = [
  { id: 'favourites', label: 'Favourites', Icon: StarIcon },
  { id: 'recents', label: 'Recents', Icon: ClockIcon },
  { id: 'contacts', label: 'Contacts', Icon: PersonCircleIcon },
  { id: 'keypad', label: 'Keypad', Icon: KeypadIcon },
  { id: 'voicemail', label: 'Voicemail', Icon: VoicemailIcon },
];

/** The iOS 26 Liquid Glass tab bar in the Phone app's Classic layout. */
export function TabBar({ active, onChange, inert }) {
  return (
    <nav className="tab-bar" aria-label="Phone" inert={inert}>
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`tab${active === id ? ' active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}>
          <Icon width="25" height="25" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
