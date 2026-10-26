import { dataKey, emptyData } from './store';

/**
 * FinSmart USSD accounts, kept in this browser's localStorage. A PIN is never stored: only a
 * salted, stretched SHA-256 hash. crypto.subtle is async and missing on plain-http LAN testing,
 * so hashing uses the small synchronous SHA-256 below.
 */
const KEY = 'finsmart-ussd:accounts:v1';
export const PIN_LENGTH = 5;
const MAX_ATTEMPTS = 3;
const LOCK_MS = 5 * 60 * 1000;
/** About 60 ms on a laptop and a few hundred on a phone; stored per account so it can change later. */
const HASH_ROUNDS = 1000;

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
  0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
  0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2,
];

const rotr = (value, bits) => (value >>> bits) | (value << (32 - bits));

export function sha256(message) {
  const bytes = new TextEncoder().encode(message);
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bitLength = bytes.length * 8;
  view.setUint32(padded.length - 8, Math.floor(bitLength / 2 ** 32));
  view.setUint32(padded.length - 4, bitLength >>> 0);

  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Int32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getInt32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }
  return hash.map((value) => (value >>> 0).toString(16).padStart(8, '0')).join('');
}

function hashPin(pin, salt, rounds = HASH_ROUNDS) {
  let digest = sha256(`${salt}:${pin}`);
  for (let round = 1; round < rounds; round += 1) digest = sha256(`${salt}:${digest}`);
  return digest;
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function loadAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (parsed?.accounts) return parsed;
  } catch {
    // Unreadable storage starts with no accounts.
  }
  return { accounts: {}, lastPhone: null };
}

function saveAccounts(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private browsing can refuse storage.
  }
}

const updateAccounts = (mutate) => {
  const state = loadAccounts();
  mutate(state);
  saveAccounts(state);
  return state;
};

export const findAccount = (phone) => (phone ? (loadAccounts().accounts[phone] ?? null) : null);

/** South African numbers as typed: 0821234567, 27821234567 or +27 82 123 4567. Returns 0821234567 or null. */
export function normalizePhone(input) {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('27') && digits.length === 11) digits = `0${digits.slice(2)}`;
  return /^0[6-8]\d{8}$/.test(digits) ? digits : null;
}

export const formatPhone = (phone) => `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;

/** Returns an error message for a PIN that can't be used, or null. Same rules banks use. */
export function pinProblem(pin) {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return `Your PIN must be ${PIN_LENGTH} digits.`;
  if (/^(\d)\1+$/.test(pin)) return "Don't use the same digit for your whole PIN.";
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return "Don't use digits in order, like 12345.";
  return null;
}

export function createAccount({ name, phone, pin }) {
  const salt = randomSalt();
  updateAccounts((state) => {
    state.accounts[phone] = {
      name,
      phone,
      salt,
      rounds: HASH_ROUNDS,
      pinHash: hashPin(pin, salt),
      createdAt: Date.now(),
      failedAttempts: 0,
      lockedUntil: 0,
    };
    state.lastPhone = phone;
  });
  try {
    localStorage.setItem(dataKey(phone), JSON.stringify(emptyData('ZAR')));
  } catch {
    // The account still works for this visit.
  }
}

export const lockedMinutes = (account, now = Date.now()) =>
  account && account.lockedUntil > now ? Math.ceil((account.lockedUntil - now) / 60_000) : 0;

/** { ok: true } | { locked: minutes } | { attemptsLeft } */
export function verifyPin(phone, pin) {
  const account = findAccount(phone);
  if (!account) return { attemptsLeft: 0 };
  const minutes = lockedMinutes(account);
  if (minutes) return { locked: minutes };

  if (hashPin(pin, account.salt, account.rounds) === account.pinHash) {
    updateAccounts((state) => {
      Object.assign(state.accounts[phone], { failedAttempts: 0, lockedUntil: 0 });
      state.lastPhone = phone;
    });
    return { ok: true };
  }

  const failed = account.failedAttempts + 1;
  const lock = failed >= MAX_ATTEMPTS;
  updateAccounts((state) => {
    Object.assign(state.accounts[phone], { failedAttempts: lock ? 0 : failed, lockedUntil: lock ? Date.now() + LOCK_MS : 0 });
  });
  return lock ? { locked: Math.ceil(LOCK_MS / 60_000) } : { attemptsLeft: MAX_ATTEMPTS - failed };
}

export function changePin(phone, newPin) {
  const salt = randomSalt();
  updateAccounts((state) => {
    Object.assign(state.accounts[phone], {
      salt,
      rounds: HASH_ROUNDS,
      pinHash: hashPin(newPin, salt),
      failedAttempts: 0,
      lockedUntil: 0,
    });
  });
}

/** Forgets this phone's remembered account, so the next dial asks for a number again. */
export const forgetDevice = () =>
  updateAccounts((state) => {
    state.lastPhone = null;
  });

export function deleteAccount(phone) {
  updateAccounts((state) => {
    delete state.accounts[phone];
    if (state.lastPhone === phone) state.lastPhone = null;
  });
  try {
    localStorage.removeItem(dataKey(phone));
  } catch {
    // Nothing else to clean up.
  }
}
