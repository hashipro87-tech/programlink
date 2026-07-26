import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  // Call after receiving a fresh token from the server (e.g., after Settings saves a new org).
  // Swaps in the new JWT so all subsequent API calls use it, then re-fetches /auth/me
  // to update the in-memory user state — no logout required.
  async function refreshUser(newToken) {
    if (newToken) localStorage.setItem('token', newToken);
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      // Token may be stale — clear and redirect to login
      localStorage.removeItem('token');
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
