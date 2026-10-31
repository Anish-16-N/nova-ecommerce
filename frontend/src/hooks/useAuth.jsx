import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nova_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Verify the stored login token when the application starts.
  useEffect(() => {
    const token = localStorage.getItem('nova_token');

    if (!token) {
      setAuthLoading(false);
      return;
    }

    if (authAPI?.getMe) {
      authAPI
        .getMe()
        .then((res) => {
          const userData = res.data.user || res.data;
          setUser(userData);
          localStorage.setItem('nova_user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('nova_token');
          localStorage.removeItem('nova_user');
          setUser(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(async (credentials) => {
    setIsLoading(true);

    try {
      const res = await authAPI.login(credentials);
      const { token, user: userData } = res.data;

      localStorage.setItem('nova_token', token);
      localStorage.setItem('nova_user', JSON.stringify(userData));

      setUser(userData);
      return { success: true, user: userData };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registration
  const register = useCallback(async (userData) => {
    setIsLoading(true);

    try {
      const res = await authAPI.register(userData);
      const { token, user: newUser } = res.data;

      localStorage.setItem('nova_token', token);
      localStorage.setItem('nova_user', JSON.stringify(newUser));

      setUser(newUser);
      return { success: true, user: newUser };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (authAPI?.logout) await authAPI.logout();
    } catch {
      // Clear local login state even if the server is unavailable.
    }

    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    setUser(null);

    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    isLoading,
    authLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Shared authentication hook used by Navbar, Login and Register pages.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

