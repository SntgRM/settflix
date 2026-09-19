const KEYS = { access: 'access', refresh: 'refresh', user: 'user' };
const SESSION_EXPIRED_EVENT = 'settflix:session-expired';

const read = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
  }
};

const remove = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
  }
};

export const session = {
  getAccess: () => read(KEYS.access),
  getRefresh: () => read(KEYS.refresh),

  getUser() {
    const raw = read(KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setTokens({ access, refresh }) {
    if (access) write(KEYS.access, access);
    if (refresh) write(KEYS.refresh, refresh);
  },

  save({ access, refresh, user }) {
    this.setTokens({ access, refresh });
    write(KEYS.user, JSON.stringify(user));
  },

  clear() {
    Object.values(KEYS).forEach(remove);
  },

  notifyExpired() {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  },

  onExpired(handler) {
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  },
};