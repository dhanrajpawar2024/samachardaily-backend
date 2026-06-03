const AUTH_KEY = 'sd_admin_auth_v1';
const USER_KEY = 'sd_admin_user_v1';

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin@123';

export const isAuthenticated = () => {
  return localStorage.getItem(AUTH_KEY) === '1';
};

export const getCurrentUser = () => {
  return localStorage.getItem(USER_KEY) || 'admin';
};

export const login = (username: string, password: string) => {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, '1');
    localStorage.setItem(USER_KEY, username);
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
};
