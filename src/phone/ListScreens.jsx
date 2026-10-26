import { InfoIcon, PlusIcon, SearchIcon } from './icons';
import { formatRecentTime } from './recents';

const FAVOURITES = [
  { name: 'FinSmart', detail: 'USSD', number: '*120*3762#' },
  { name: 'FinSmart Budgets', detail: 'USSD', number: '*120*3762*1#' },
  { name: 'FinSmart Scam check', detail: 'USSD', number: '*120*3762*5#' },
  { name: 'FinSmart Learn', detail: 'USSD', number: '*120*3762*6#' },
];

const CONTACTS = [
  { name: 'FinSmart', number: '*120*3762#' },
  { name: 'FinSmart Alerts', number: '*120*3762*7#' },
  { name: 'FinSmart Income', number: '*120*3762*3#' },
];

const initials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function Avatar({ name }) {
  return <div className="avatar">{initials(name)}</div>;
}

function NavBar({ left, right }) {
  return (
    <div className="nav-bar">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

const GlassButton = ({ children, label }) => (
  <button type="button" className="glass-button" aria-label={label}>
    {children}
  </button>
);

export function FavouritesScreen({ onDial }) {
  return (
    <div className="list-screen">
      <NavBar
        left={<GlassButton label="Edit">Edit</GlassButton>}
        right={
          <GlassButton label="Add favourite">
            <PlusIcon width="20" height="20" />
          </GlassButton>
        }
      />
      <h1 className="large-title">Favourites</h1>
      <div className="list">
        {FAVOURITES.map((item) => (
          <button key={item.number} type="button" className="list-row" onClick={() => onDial(item.number)}>
            <Avatar name={item.name} />
            <div className="row-text">
              <div className="row-title">{item.name}</div>
              <div className="row-subtitle">{item.detail}</div>
            </div>
            <InfoIcon className="row-info" width="23" height="23" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecentsScreen({ recents, onDial }) {
  return (
    <div className="list-screen">
      <NavBar
        left={<GlassButton label="Edit">Edit</GlassButton>}
        right={
          <div className="segmented" role="tablist">
            <span className="segment active">All</span>
            <span className="segment">Missed</span>
          </div>
        }
      />
      <h1 className="large-title">Recents</h1>
      {recents.length === 0 ? (
        <div className="empty-state">No Recents</div>
      ) : (
        <div className="list">
          {recents.map((item) => (
            <button key={`${item.at}-${item.number}`} type="button" className="list-row compact" onClick={() => onDial(item.number)}>
              <div className="row-text">
                <div className="row-title">{item.number}</div>
                <div className="row-subtitle">{item.kind === 'ussd' ? 'USSD' : 'mobile'}</div>
              </div>
              <span className="row-time">{formatRecentTime(item.at)}</span>
              <InfoIcon className="row-info" width="23" height="23" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactsScreen({ onDial }) {
  return (
    <div className="list-screen">
      <NavBar
        left={<span />}
        right={
          <GlassButton label="Add contact">
            <PlusIcon width="20" height="20" />
          </GlassButton>
        }
      />
      <h1 className="large-title">Contacts</h1>
      <div className="search-field">
        <SearchIcon width="17" height="17" />
        <span>Search</span>
      </div>
      <div className="my-card">
        <div className="avatar avatar-large">ME</div>
        <div className="row-text">
          <div className="row-title my-card-name">My Card</div>
          <div className="row-subtitle">FinSmart USSD simulator</div>
        </div>
      </div>
      <div className="section-letter">F</div>
      <div className="list">
        {CONTACTS.map((item) => (
          <button key={item.number} type="button" className="list-row compact" onClick={() => onDial(item.number)}>
            <div className="row-text">
              <div className="row-title">{item.name}</div>
            </div>
            <span className="row-time">{item.number}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function VoicemailScreen() {
  return (
    <div className="list-screen">
      <NavBar left={<span />} right={<span />} />
      <h1 className="large-title">Voicemail</h1>
      <div className="empty-state tall">No Voicemail</div>
    </div>
  );
}
