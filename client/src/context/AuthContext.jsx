import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('samarth_token') || null);
  const [cmsContent, setCmsContent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Public CMS Content
  const fetchCmsContent = async () => {
    try {
      const res = await fetch('/api/cms/content');
      const data = await res.json();
      if (data.success) {
        setCmsContent(data.content);
      }
    } catch (err) {
      console.warn('Could not load dynamic CMS content:', err);
    }
  };

  // Fetch Current User & Wallet
  const fetchMe = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setWallet(data.wallet);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCmsContent();
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (loginId, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('samarth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await fetchMe(data.token);
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || 'Login failed' };
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('samarth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await fetchMe(data.token);
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('samarth_token');
    setToken(null);
    setUser(null);
    setWallet(null);
  };

  const refreshUser = () => {
    if (token) fetchMe(token);
  };

  const updateWalletLocally = (newBalance, todaySolved) => {
    setWallet(prev => prev ? {
      ...prev,
      currentBalance: newBalance,
      todayCaptchasSolved: todaySolved !== undefined ? todaySolved : prev.todayCaptchasSolved
    } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      wallet,
      token,
      cmsContent,
      loading,
      login,
      register,
      logout,
      refreshUser,
      refreshCms: fetchCmsContent,
      updateWalletLocally
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
