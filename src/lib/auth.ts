type User = { id: number; username: string; email: string } | null;

const TOKEN_KEY = 'cosy_token';
const USER_KEY = 'cosy_user';

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  window.dispatchEvent(new CustomEvent('auth-change'));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setUser(user: User) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  window.dispatchEvent(new CustomEvent('auth-change'));
}

export function getUser(): User {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  setToken(null);
  setUser(null);
}

export default { setToken, getToken, setUser, getUser, logout };
