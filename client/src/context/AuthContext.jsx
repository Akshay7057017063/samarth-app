
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "samarth_token";

// ============================================================
// API BASE URL
// ============================================================
// Local development:
//   http://localhost:5000/api
//
// Production:
//   https://api.bull-mark.com/api
//
// Vercel will use VITE_API_BASE_URL from its environment
// variables during the production build.
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.bull-mark.com/api";

// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || null
  );

  const [cmsContent, setCmsContent] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // PUBLIC CMS CONTENT
  // ==========================================================

  const fetchCmsContent = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/cms/content`
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setCmsContent(data.content || null);
      }
    } catch (error) {
      console.warn(
        "Could not load dynamic CMS content:",
        error
      );
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);

    setToken(null);
    setUser(null);
    setWallet(null);
  };

  // ==========================================================
  // FETCH CURRENT CUSTOMER SESSION
  // ==========================================================

  const fetchMe = async (authToken) => {
    if (!authToken) {
      setUser(null);
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/auth/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        localStorage.removeItem(TOKEN_KEY);

        setToken(null);
        setUser(null);
        setWallet(null);

        return;
      }

      setUser(data.user || null);
      setWallet(data.wallet || null);
    } catch (error) {
      console.error(
        "Failed to load customer session:",
        error
      );

      localStorage.removeItem(TOKEN_KEY);

      setToken(null);
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL APP LOAD / TOKEN CHANGE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const initializeSession = async () => {
      setLoading(true);

      // Public CMS can load for everyone.
      fetchCmsContent();

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setWallet(null);
          setLoading(false);
        }

        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (cancelled) {
          return;
        }

        if (!res.ok || !data.success) {
          localStorage.removeItem(TOKEN_KEY);

          setToken(null);
          setUser(null);
          setWallet(null);

          return;
        }

        setUser(data.user || null);
        setWallet(data.wallet || null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to restore customer session:",
          error
        );

        localStorage.removeItem(TOKEN_KEY);

        setToken(null);
        setUser(null);
        setWallet(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (loginId, password) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loginId,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message:
            data.message ||
            "Invalid login credentials.",
        };
      }

      if (!data.token) {
        return {
          success: false,
          message:
            "Login succeeded but authentication token was not received.",
        };
      }

      localStorage.setItem(
        TOKEN_KEY,
        data.token
      );

      setToken(data.token);
      setUser(data.user || null);
      setWallet(data.wallet || null);

      // Refresh complete customer session.
      await fetchMe(data.token);

      return {
        success: true,
        user: data.user || null,
        wallet: data.wallet || null,
        message:
          data.message || "Login successful.",
      };
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return {
        success: false,
        message:
          "Unable to connect to the server. Please try again.",
      };
    }
  };

  // ==========================================================
  // REGISTER
  // ==========================================================

  const register = async (formData) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message:
            data.message ||
            "Registration failed.",
        };
      }

      if (!data.token) {
        return {
          success: false,
          message:
            "Registration succeeded but authentication token was not received.",
        };
      }

      localStorage.setItem(
        TOKEN_KEY,
        data.token
      );

      setToken(data.token);
      setUser(data.user || null);
      setWallet(data.wallet || null);

      // Load complete customer session.
      await fetchMe(data.token);

      return {
        success: true,
        user: data.user || null,
        wallet: data.wallet || null,
        message:
          data.message ||
          "Registration successful.",
      };
    } catch (error) {
      console.error(
        "REGISTRATION ERROR:",
        error
      );

      return {
        success: false,
        message:
          "Unable to connect to the server. Please try again.",
      };
    }
  };

  // ==========================================================
  // REFRESH CURRENT CUSTOMER
  // ==========================================================

  const refreshUser = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    await fetchMe(token);
  };

  // ==========================================================
  // LOCAL WALLET UPDATE
  // ==========================================================

  const updateWalletLocally = (
    newBalance,
    todaySolved
  ) => {
    setWallet((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        currentBalance:
          newBalance !== undefined &&
          newBalance !== null
            ? Number(newBalance)
            : previous.currentBalance,

        todayCaptchasSolved:
          todaySolved !== undefined &&
          todaySolved !== null
            ? Number(todaySolved)
            : previous.todayCaptchasSolved,
      };
    });
  };

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const contextValue = {
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

    updateWalletLocally,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// USE AUTH HOOK
// ============================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
};
