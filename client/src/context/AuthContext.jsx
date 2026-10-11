import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { createDeviceProof } from "../utils/deviceKey";

const AuthContext =
  createContext(null);

const TOKEN_KEY =
  "samarth_token";

/* ============================================================
   API BASE URL
============================================================ */

/*
 * LOCAL:
 * VITE_API_BASE_URL=/api
 *
 * PRODUCTION:
 * VITE_API_BASE_URL=https://api.bull-mark.com/api
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "/api"
).replace(/\/+$/, "");

/* ============================================================
   DEBUG
============================================================ */

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

/* ============================================================
   SAFE JSON RESPONSE HELPER
============================================================ */

const parseResponse =
  async (response) => {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      return response.json();
    }

    const text =
      await response.text();

    return {
      success: false,
      message:
        text ||
        `Request failed with status ${response.status}.`,
    };
  };

/* ============================================================
   AUTH PROVIDER
============================================================ */

export const AuthProvider = ({
  children,
}) => {
  /* ==========================================================
     STATE
  ========================================================== */

  const [user, setUser] =
    useState(null);

  const [wallet, setWallet] =
    useState(null);

  const [token, setToken] =
    useState(null);

  const [cmsContent, setCmsContent] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /* ==========================================================
     PUBLIC CMS CONTENT
  ========================================================== */

  const fetchCmsContent =
    useCallback(async () => {
      try {
        const url =
          `${API_BASE_URL}/cms/content`;

        console.log(
          "📄 CMS REQUEST:",
          url
        );

        const res =
          await fetch(url, {
            method: "GET",
            headers: {
              Accept:
                "application/json",
            },
          });

        const data =
          await parseResponse(res);

        if (
          res.ok &&
          data?.success
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

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const logout =
    useCallback(() => {
      /*
       * Remove any old legacy tokens.
       *
       * Active authentication is intentionally kept
       * only in React memory.
       */
      localStorage.removeItem(
        TOKEN_KEY
      );

      sessionStorage.removeItem(
        TOKEN_KEY
      );

      setToken(null);
      setUser(null);
      setWallet(null);
    }, []);

  /* ==========================================================
     FETCH CURRENT CUSTOMER SESSION
  ========================================================== */

  const fetchMe =
    useCallback(
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

          const res =
            await fetch(url, {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
                Authorization:
                  `Bearer ${authToken}`,
              },
            });

          const data =
            await parseResponse(res);

          /* ==================================================
             INVALID SESSION
          ================================================== */

          if (
            !res.ok ||
            !data?.success
          ) {
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

          /* ==================================================
             VALID SESSION
          ================================================== */

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

  /* ==========================================================
     INITIAL APP LOAD
  ========================================================== */

  /*
   * IMPORTANT:
   *
   * We intentionally DO NOT restore authentication from
   * localStorage or sessionStorage.
   *
   * Existing legacy tokens are removed.
   *
   * Browser refresh requires login again.
   */

  useEffect(() => {
    let cancelled = false;

    const initializeApp =
      async () => {
        setLoading(true);

        /* -----------------------------------------------
           REMOVE LEGACY AUTH TOKENS
        ------------------------------------------------ */

        localStorage.removeItem(
          TOKEN_KEY
        );

        sessionStorage.removeItem(
          TOKEN_KEY
        );

        /* -----------------------------------------------
           RESET AUTH STATE
        ------------------------------------------------ */

        if (!cancelled) {
          setToken(null);
          setUser(null);
          setWallet(null);
        }

        /* -----------------------------------------------
           PUBLIC CMS CONTENT
        ------------------------------------------------ */

        await fetchCmsContent();

        /* -----------------------------------------------
           FINISH INITIAL LOADING
        ------------------------------------------------ */

        if (!cancelled) {
          setLoading(false);
        }
      };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [fetchCmsContent]);

  /* ==========================================================
     LOGIN
  ========================================================== */

  const login =
    async (
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

        /* Device-bound key proof (server verifies signature) */
        const deviceProof =
          await createDeviceProof(
            "login",
            String(loginId).trim()
          );

        const res =
          await fetch(url, {
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
              deviceProof,
            }),
          });

        const data =
          await parseResponse(res);

        console.log(
          "🔐 LOGIN RESPONSE:",
          data
        );

        /* -----------------------------------------------
           BACKEND ERROR
        ------------------------------------------------ */

        if (
          !res.ok ||
          !data?.success
        ) {
          return {
            success: false,
            code: data?.code || "",
            message:
              data?.message ||
              "Invalid login credentials.",
          };
        }

        /* -----------------------------------------------
           TOKEN VALIDATION
        ------------------------------------------------ */

        if (!data?.token) {
          return {
            success: false,
            message:
              "Login succeeded but authentication token was not received.",
          };
        }

        /* -----------------------------------------------
           STORE TOKEN ONLY IN MEMORY
        ------------------------------------------------ */

        setToken(
          data.token
        );

        /* -----------------------------------------------
           INITIAL USER STATE
        ------------------------------------------------ */

        setUser(
          data.user || null
        );

        setWallet(
          data.wallet || null
        );

        /* -----------------------------------------------
           FETCH COMPLETE CUSTOMER SESSION
        ------------------------------------------------ */

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

  /* ==========================================================
     OLD PUBLIC REGISTER
  ========================================================== */

  /*
   * PUBLIC REGISTRATION IS DISABLED.
   *
   * Kept only so any old component importing `register`
   * does not crash.
   *
   * This function NEVER calls the backend.
   */

  const register =
    async () => {
      return {
        success: false,
        message:
          "Public registration is disabled. Please login and register new members from your dashboard.",
      };
    };

  /* ==========================================================
     REGISTER NEW MEMBER
  ========================================================== */

  /*
   * POST /api/referral/register
   *
   * ONLY an authenticated customer can use this.
   *
   * The backend determines the sponsor from:
   *
   *   req.user.id
   *
   * Therefore frontend sponsorId / sponsorCode values
   * are not trusted by the backend.
   *
   * New member:
   * - status = inactive
   * - wallet = ₹0
   * - no automatic login
   * - activation happens later using admin PIN
   */

  const registerMember =
    async (formData) => {
      try {
        /* -----------------------------------------------
           AUTH REQUIRED
        ------------------------------------------------ */

        if (!token) {
          return {
            success: false,
            message:
              "Please login again to register a new member.",
          };
        }

        /* -----------------------------------------------
           API REQUEST
        ------------------------------------------------ */

        const url =
          `${API_BASE_URL}/referral/register`;

        console.log(
          "📝 MEMBER REGISTER REQUEST:",
          url
        );

        const res =
          await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify(
              formData || {}
            ),
          });

        const data =
          await parseResponse(res);

        console.log(
          "📝 MEMBER REGISTER RESPONSE:",
          data
        );

        /* -----------------------------------------------
           AUTHENTICATION FAILURE
        ------------------------------------------------ */

        if (
          res.status === 401
        ) {
          setToken(null);
          setUser(null);
          setWallet(null);

          return {
            success: false,
            message:
              "Your session has expired. Please login again.",
          };
        }

        /* -----------------------------------------------
           BACKEND ERROR
        ------------------------------------------------ */

        if (
          !res.ok ||
          !data?.success
        ) {
          return {
            success: false,
            message:
              data?.message ||
              "Member registration failed.",
          };
        }

        /* -----------------------------------------------
           SUCCESS
        ------------------------------------------------ */

        /*
         * Do NOT modify the currently logged-in customer's
         * authentication session.
         *
         * The new member is a separate inactive account.
         */

        return data;
      } catch (error) {
        console.error(
          "❌ REGISTER MEMBER ERROR:",
          error
        );

        return {
          success: false,
          message:
            "Network error. Please try again.",
        };
      }
    };

  /* ==========================================================
     REFRESH CURRENT CUSTOMER
  ========================================================== */

  const refreshUser =
    async () => {
      if (!token) {
        setUser(null);
        setWallet(null);
        return false;
      }

      setLoading(true);

      return fetchMe(
        token
      );
    };

  /* ==========================================================
     LOCAL WALLET UPDATE
  ========================================================== */

  const updateWalletLocally =
    (
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
              newBalance !==
                null
                ? Number(
                    newBalance
                  )
                : previous.currentBalance,

            todayCaptchasSolved:
              todaySolved !==
                undefined &&
              todaySolved !==
                null
                ? Number(
                    todaySolved
                  )
                : previous.todayCaptchasSolved,
          };
        }
      );
    };

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const contextValue = {
    user,
    wallet,
    token,
    cmsContent,
    loading,

    login,

    /*
     * Backward-compatible stub.
     * Public registration remains disabled.
     */
    register,

    /*
     * Authenticated customer registration.
     */
    registerMember,

    logout,

    refreshUser,

    refreshCms:
      fetchCmsContent,

    updateWalletLocally,
  };

  /* ==========================================================
     PROVIDER
  ========================================================== */

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ============================================================
   USE AUTH HOOK
============================================================ */

export const useAuth =
  () => {
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