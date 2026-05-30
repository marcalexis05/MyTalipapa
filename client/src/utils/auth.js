// client/src/utils/auth.js
// Simple authentication helpers for the MyTalipapa client.

/** Store JWT token */
export const saveToken = token => {
  localStorage.setItem('authToken', token);
};

/** Retrieve JWT token */
export const getToken = () => localStorage.getItem('authToken');

/** Store user object */
export const saveUser = user => {
  localStorage.setItem('user', JSON.stringify(user));
};

/** Retrieve stored user object */
export const getUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Decode base64 payload of a JWT (no verification) */
export const decodeToken = token => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

// React hook to get the current user's display name.
import { useState, useEffect } from 'react';

export const useCurrentUser = () => {
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser && storedUser.full_name) {
      setUserName(storedUser.full_name);
    } else if (storedUser && storedUser.name) {
      setUserName(storedUser.name);
    } else {
      // Fallback: try to decode token for name if present
      const token = getToken();
      if (token) {
        const data = decodeToken(token);
        if (data && data.full_name) setUserName(data.full_name);
        else if (data && data.name) setUserName(data.name);
      }
    }
    setLoading(false);
  }, []);

  return { userName, loading, error };
};
