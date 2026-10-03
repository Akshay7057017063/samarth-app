
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

  // IMPORTANT:
  // Token is intentionally stored ONLY in React state.
  //
  // We do NOT use localStorage or sessionStorage.
  //
  // Therefore:
  // - Refresh = logout
  // - Browser reopen = logout
  // - New app load = login required
  const [token, setToken] =
    useState(null);

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
    // --------------------------------------------------------
    // IMPORTANT:
    // Clear any old tokens that may have been created by the
    // previous version of the application.
    // --------------------------------------------------------

    localStorage.removeItem(
      TOKEN_KEY
    );

    sessionStorage.removeItem(
      TOKEN_KEY
    );

    // --------------------------------------------------------
    // Clear current React authentication state.
    // --------------------------------------------------------

    setToken(null);
    setUser(null);
    setWallet(null);
  }, []);

  // ==========================================================
  // FETCH CURRENT CUSTOMER SESSION
  // ==========================================================
  //
  // This function is NOT called automatically when the app
  // starts.
  //
  // It is called only:
  // 1. After a successful manual login
  // 2. When refreshUser() is explicitly requested
  //
  // ==========================================================

  const fetchMe = useCallback(
    async (authToken) => {
      if (!authToken) {
        setUser(null);
        setWallet(null);
        setLoading(false);

        return false;
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

        // ----------------------------------------------------
        // INVALID SESSION
        // ----------------------------------------------------

        if (
          !res.ok ||
          !data.success
        ) {
          // Remove any legacy stored tokens.
          localStorage.removeItem(
            TOKEN_KEY
          );

          sessionStorage.removeItem(
            TOKEN_KEY
          );

          setToken(null);
          setUser(null);
          setWallet(null);

          return false;
        }

        // ----------------------------------------------------
        // VALID SESSION
        // ----------------------------------------------------

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

        // Remove any legacy stored tokens.
        localStorage.removeItem(
          TOKEN_KEY
        );

        sessionStorage.removeItem(
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
  // INITIAL APP LOAD
  // ==========================================================
  //
  // IMPORTANT:
  //
  // We intentionally DO NOT restore an authentication session.
  //
  // Previous version:
  //
  // localStorage -> token -> fetchMe() -> automatic login
  //
  // New version:
  //
  // app starts -> clear old token -> user = null
  // -> user must manually login
  //
  // This means even after browser refresh, the user must login
  // again.
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const initializeApp =
      async () => {
        setLoading(true);

        // ----------------------------------------------------
        // REMOVE LEGACY AUTH TOKENS
        // ----------------------------------------------------
        //
        // This is important because the previous version used
        // localStorage. Existing users may still have an old
        // samarth_token stored in their browser.
        // ----------------------------------------------------

        localStorage.removeItem(
          TOKEN_KEY
        );

        sessionStorage.removeItem(
          TOKEN_KEY
        );

        // ----------------------------------------------------
        // RESET AUTH STATE
        // ----------------------------------------------------

        if (!cancelled) {
          setToken(null);
          setUser(null);
          setWallet(null);
        }

        // ----------------------------------------------------
        // PUBLIC CMS CONTENT
        // ----------------------------------------------------
        //
        // CMS content is public and should load regardless of
        // authentication.
        // ----------------------------------------------------

        await fetchCmsContent();

        // ----------------------------------------------------
        // FINISH INITIAL LOADING
        // ----------------------------------------------------

        if (!cancelled) {
          setLoading(false);
        }
      };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [fetchCmsContent]);

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
      // BACKEND ERROR
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
      // TOKEN VALIDATION
      // -------------------------------------------------------

      if (!data.token) {
        return {
          success: false,

          message:
            "Login succeeded but authentication token was not received.",
        };
      }

      // -------------------------------------------------------
      // IMPORTANT:
      // DO NOT SAVE TOKEN TO localStorage.
      // DO NOT SAVE TOKEN TO sessionStorage.
      //
      // Token exists only in React memory.
      //
      // Therefore:
      // Refresh browser -> token disappears.
      // Close/reopen app -> token disappears.
      // User must login manually again.
      // -------------------------------------------------------

      setToken(data.token);

      // -------------------------------------------------------
      // UPDATE USER STATE
      // -------------------------------------------------------

      setUser(
        data.user || null
      );

      // -------------------------------------------------------
      // UPDATE WALLET STATE
      // -------------------------------------------------------

      setWallet(
        data.wallet || null
      );

      // -------------------------------------------------------
      // FETCH COMPLETE CUSTOMER SESSION
      // -------------------------------------------------------

      const sessionLoaded =
        await fetchMe(
          data.token
        );

      if (!sessionLoaded) {
        return {
          success: false,

          message:
            "Login succeeded but customer session could not be loaded.",
        };
      }

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
  //
  // IMPORTANT:
  //
  // Registration does NOT automatically login the customer.
  //
  // After registration:
  // Registration successful
  //       ↓
  // Login page
  //       ↓
  // User manually enters credentials
  //       ↓
  // Dashboard
  //
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
      // BACKEND ERROR
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
      // REGISTRATION SUCCESS
      // -------------------------------------------------------
      //
      // Backend may return a token after registration, but we
      // intentionally ignore it on the frontend.
      //
      // Customer must login manually.
      // -------------------------------------------------------

      // Clear any old/legacy authentication data.
      localStorage.removeItem(
        TOKEN_KEY
      );

      sessionStorage.removeItem(
        TOKEN_KEY
      );

      // Make sure customer is NOT authenticated.
      setToken(null);
      setUser(null);
      setWallet(null);

      return {
        success: true,

        user:
          data.user || null,

        wallet:
          data.wallet || null,

        message:
          "Registration successful. Please login manually.",
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
  //
  // This function is intentionally available only for an
  // already authenticated React session.
  //
  // Browser refresh will NOT call this automatically.
  //
  // ==========================================================

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setWallet(null);

      return false;
    }

    setLoading(true);

    return fetchMe(token);
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

