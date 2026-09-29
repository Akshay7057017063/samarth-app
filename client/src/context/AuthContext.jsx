
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "samarth_token";

// ============================================================
// API BASE URL
// ============================================================
//
// LOCAL (.env)
// VITE_API_BASE_URL=/api
//
// PRODUCTION (.env.production)
// VITE_API_BASE_URL=https://api.bull-mark.com/api
//
// Vite loads the correct environment file automatically
// based on the current mode.
//
// IMPORTANT:
// Do not hard-code the production API URL inside components.
// ============================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/+$/, "");

// ============================================================
// DEBUG
// ============================================================

console.log(
  "🌐 API BASE URL:",
  API_BASE_URL
);

console.log(
  "🛠️ Development mode:",
  import.meta.env.DEV
);

console.log(
  "📦 Production mode:",
  import.meta.env.PROD
);

// ============================================================
// SAFE JSON RESPONSE HELPER
// ============================================================
//
// Prevents JSON parsing crashes when backend/proxy returns
// an HTML error page, empty response, or invalid JSON.
// ============================================================

const parseResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType.includes("application/json")
  ) {
    return response.json();
  }

  const text = await response.text();

  return {
    success: false,
    message:
      text ||
      `Request failed with status ${response.status}.`,
  };
};

// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider = ({
  children,
}) => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] =
    useState(null);

  const [wallet, setWallet] =
    useState(null);

  const [token, setToken] =
    useState(
      () =>
        localStorage.getItem(
          TOKEN_KEY
        ) || null
    );

  const [cmsContent, setCmsContent] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // PUBLIC CMS CONTENT
  // ==========================================================

  const fetchCmsContent =
    useCallback(async () => {
      try {
        const url =
          `${API_BASE_URL}/cms/content`;

        console.log(
          "📄 CMS REQUEST:",
          url
        );

        const res = await fetch(
          url,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },
          }
        );

        const data =
          await parseResponse(res);

        if (
          res.ok &&
          data.success
        ) {
          setCmsContent(
            data.content || null
          );
        }
      } catch (error) {
        console.warn(
          "Could not load dynamic CMS content:",
          error
        );
      }
    }, []);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = useCallback(() => {
    localStorage.removeItem(
      TOKEN_KEY
    );

    setToken(null);
    setUser(null);
    setWallet(null);
  }, []);

  // ==========================================================
  // FETCH CURRENT CUSTOMER SESSION
  // ==========================================================

  const fetchMe = useCallback(
    async (authToken) => {
      if (!authToken) {
        setUser(null);
        setWallet(null);
        setLoading(false);

        return;
      }

      try {
        const url =
          `${API_BASE_URL}/auth/me`;

        console.log(
          "👤 SESSION REQUEST:",
          url
        );

        const res = await fetch(
          url,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${authToken}`,
            },
          }
        );

        const data =
          await parseResponse(res);

        if (
          !res.ok ||
          !data.success
        ) {
          localStorage.removeItem(
            TOKEN_KEY
          );

          setToken(null);
          setUser(null);
          setWallet(null);

          return false;
        }

        setUser(
          data.user || null
        );

        setWallet(
          data.wallet || null
        );

        return true;
      } catch (error) {
        console.error(
          "FAILED TO LOAD CUSTOMER SESSION:",
          error
        );

        localStorage.removeItem(
          TOKEN_KEY
        );

        setToken(null);
        setUser(null);
        setWallet(null);

        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL APP LOAD / TOKEN CHANGE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const initializeSession =
      async () => {
        setLoading(true);

        // Public content can load for everyone.
        await fetchCmsContent();

        if (cancelled) {
          return;
        }

        // ----------------------------------------------------
        // No token
        // ----------------------------------------------------

        if (!token) {
          if (!cancelled) {
            setUser(null);
            setWallet(null);
            setLoading(false);
          }

          return;
        }

        // ----------------------------------------------------
        // Restore session
        // ----------------------------------------------------

        await fetchMe(token);
      };

    initializeSession();

    return () => {
      cancelled = true;
    };
  }, [
    token,
    fetchCmsContent,
    fetchMe,
  ]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (
    loginId,
    password
  ) => {
    try {
      const url =
        `${API_BASE_URL}/auth/login`;

      console.log(
        "🔐 LOGIN REQUEST:",
        url
      );

      const res = await fetch(
        url,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            loginId,
            password,
          }),
        }
      );

      const data =
        await parseResponse(res);

      console.log(
        "🔐 LOGIN RESPONSE:",
        data
      );

      // -------------------------------------------------------
      // Backend error
      // -------------------------------------------------------

      if (
        !res.ok ||
        !data.success
      ) {
        return {
          success: false,

          message:
            data.message ||
            "Invalid login credentials.",
        };
      }

      // -------------------------------------------------------
      // Token validation
      // -------------------------------------------------------

      if (!data.token) {
        return {
          success: false,

          message:
            "Login succeeded but authentication token was not received.",
        };
      }

      // -------------------------------------------------------
      // Save token
      // -------------------------------------------------------

      localStorage.setItem(
        TOKEN_KEY,
        data.token
      );

      // -------------------------------------------------------
      // Update state
      // -------------------------------------------------------

      setToken(data.token);

      setUser(
        data.user || null
      );

      setWallet(
        data.wallet || null
      );

      // -------------------------------------------------------
      // Refresh complete customer session
      // -------------------------------------------------------

      await fetchMe(
        data.token
      );

      return {
        success: true,

        user:
          data.user || null,

        wallet:
          data.wallet || null,

        message:
          data.message ||
          "Login successful.",
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

  const register = async (
    formData
  ) => {
    try {
      const url =
        `${API_BASE_URL}/auth/register`;

      console.log(
        "📝 REGISTER REQUEST:",
        url
      );

      const res = await fetch(
        url,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify(
            formData
          ),
        }
      );

      const data =
        await parseResponse(res);

      console.log(
        "📝 REGISTER RESPONSE:",
        data
      );

      // -------------------------------------------------------
      // Backend error
      // -------------------------------------------------------

      if (
        !res.ok ||
        !data.success
      ) {
        return {
          success: false,

          message:
            data.message ||
            "Registration failed.",
        };
      }

      // -------------------------------------------------------
      // Token validation
      // -------------------------------------------------------

      if (!data.token) {
        return {
          success: false,

          message:
            "Registration succeeded but authentication token was not received.",
        };
      }

      // -------------------------------------------------------
      // Save token
      // -------------------------------------------------------

      localStorage.setItem(
        TOKEN_KEY,
        data.token
      );

      // -------------------------------------------------------
      // Update state
      // -------------------------------------------------------

      setToken(data.token);

      setUser(
        data.user || null
      );

      setWallet(
        data.wallet || null
      );

      // -------------------------------------------------------
      // Refresh complete session
      // -------------------------------------------------------

      await fetchMe(
        data.token
      );

      return {
        success: true,

        user:
          data.user || null,

        wallet:
          data.wallet || null,

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
    setWallet(
      (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          currentBalance:
            newBalance !==
              undefined &&
            newBalance !== null
              ? Number(
                  newBalance
                )
              : previous.currentBalance,

          todayCaptchasSolved:
            todaySolved !==
              undefined &&
            todaySolved !== null
              ? Number(
                  todaySolved
                )
              : previous.todayCaptchasSolved,
        };
      }
    );
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

    refreshCms:
      fetchCmsContent,

    updateWalletLocally,
  };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// USE AUTH HOOK
// ============================================================

export const useAuth = () => {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
};

