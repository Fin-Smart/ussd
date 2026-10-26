import {
  createAccount,
  deleteAccount,
  findAccount,
  forgetDevice,
  formatPhone,
  loadAccounts,
  lockedMinutes,
  normalizePhone,
  PIN_LENGTH,
  pinProblem,
  verifyPin,
} from '../finsmart/accounts';
import { incomeAmount, mainMenu, newBudgetName } from './menus';

/**
 * What a dial shows before the main menu. Like banking USSD, every session asks for the PIN.
 * A phone remembers its last account, so returning users only type their PIN.
 */
export function startMenu() {
  const { lastPhone } = loadAccounts();
  const known = findAccount(lastPhone);
  if (known) return pinScreen(known.phone, true)();
  return {
    body: 'Welcome to FinSmart\nMoney made simple.',
    footer: '0. Exit',
    items: [
      { label: 'Log in', to: loginPhone },
      { label: 'Create account', to: registerName },
    ],
  };
}

function attemptLogin(ctx, phone, pin) {
  const result = verifyPin(phone, pin);
  if (result.ok) {
    ctx.signIn(phone);
    const steps = ctx.pendingSteps;
    ctx.pendingSteps = [];
    return { root: mainMenu, replay: steps };
  }
  if (result.locked) return { end: `Too many wrong PINs. Your account is locked for ${result.locked} minutes.` };
  return { error: `Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.` };
}

const pinScreen = (phone, isStart) => () => {
  const account = findAccount(phone);
  if (!account) return { body: 'This account no longer exists.', items: [{ label: 'Create account', to: registerName }] };
  const minutes = lockedMinutes(account);
  if (minutes) {
    const locked = `${account.name}'s account is locked after too many wrong PINs. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
    // On the start screen the phone must still let someone else log in or sign up.
    if (!isStart) return { end: true, body: locked };
    return {
      body: locked,
      footer: '0. Exit',
      items: [
        { label: 'Log in with another number', to: loginPhone },
        { label: 'Create account', to: registerName },
      ],
    };
  }
  return {
    body: `${isStart ? 'Welcome back to FinSmart, ' : 'Hi '}${account.name}.\nEnter your ${PIN_LENGTH}-digit PIN:`,
    keyboard: 'pin',
    footer: isStart ? '0. Exit' : undefined,
    items: [
      ...(isStart ? [{ label: `Not ${account.name}? Log in`, to: loginPhone }] : []),
      ...(isStart ? [{ label: 'Create account', to: registerName }] : []),
      { label: 'Forgot PIN', to: forgotPin(phone) },
    ],
    onInput: (value, ctx) => attemptLogin(ctx, phone, value),
  };
};

function loginPhone() {
  return {
    body: 'Log in\nEnter your cellphone number:',
    onInput: (value) => {
      const phone = normalizePhone(value);
      if (!phone) return { error: 'Enter a valid number, e.g. 0821234567.' };
      return findAccount(phone) ? pinScreen(phone, false) : noAccount(phone);
    },
  };
}

const noAccount = (phone) => () => ({
  body: `There is no FinSmart account for ${formatPhone(phone)} on this phone.`,
  items: [
    { label: 'Create account', run: () => ({ replace: registerName }) },
    { label: 'Try another number', run: () => ({ replace: loginPhone }) },
  ],
});

const forgotPin = (phone) => () => ({
  body: "For your safety FinSmart can't show or reset your PIN. You can delete this account from this phone and create a new one. Its data will be lost.",
  items: [{ label: 'Delete account and start over', to: forgotConfirm(phone) }],
});

const forgotConfirm = (phone) => () => ({
  body: `Delete the account for ${formatPhone(phone)} and all its data?`,
  items: [
    {
      label: 'Yes, delete it',
      run: () => {
        deleteAccount(phone);
        forgetDevice();
        return { root: startMenu, push: registerName, notice: 'Account deleted. Create a new one.' };
      },
    },
    { label: 'No', run: () => ({ back: true }) },
  ],
});

// ---------------------------------------------------------------- Create account

function registerName() {
  return {
    body: 'Create account\nEnter your first name:',
    keyboard: 'text',
    onInput: (value) => {
      const name = value.trim().replace(/\s+/g, ' ').slice(0, 20);
      if (!/^\p{L}[\p{L} '-]+$/u.test(name)) return { error: 'Enter your first name using letters only.' };
      return registerPhone({ name: name[0].toUpperCase() + name.slice(1) });
    },
  };
}

const registerPhone = (draft) => () => ({
  body: `Hi ${draft.name}. Enter your cellphone number, e.g. 0821234567:`,
  onInput: (value) => {
    const phone = normalizePhone(value);
    if (!phone) return { error: 'Enter a valid number, e.g. 0821234567.' };
    if (findAccount(phone)) return { error: `${formatPhone(phone)} already has an account. Reply 00 and log in.` };
    return registerPin({ ...draft, phone });
  },
});

const registerPin = (draft) => () => ({
  body: `Create a ${PIN_LENGTH}-digit PIN. You will use it every time you dial FinSmart:`,
  keyboard: 'pin',
  onInput: (value) => {
    const problem = pinProblem(value);
    return problem ? { error: problem } : registerConfirm(draft, value);
  },
});

const registerConfirm = (draft, pin) => () => ({
  body: 'Enter your PIN again to confirm:',
  keyboard: 'pin',
  onInput: (value, ctx) => {
    if (value !== pin) return { back: true, error: "The PINs don't match. Create your PIN again." };
    createAccount({ ...draft, pin });
    ctx.signIn(draft.phone);
    ctx.pendingSteps = [];
    return { root: mainMenu, push: accountCreated };
  },
});

function accountCreated(ctx) {
  const account = findAccount(ctx.phone);
  return {
    body: `Welcome to FinSmart, ${account?.name ?? ''}! Your account is ready. Never share your PIN. Start by adding your income.`,
    items: [
      { label: 'Add my income', run: () => ({ replace: incomeAmount('monthly') }) },
      { label: 'Create a budget', run: () => ({ replace: newBudgetName }) },
      { label: 'Main menu', run: () => ({ home: true }) },
    ],
  };
}
