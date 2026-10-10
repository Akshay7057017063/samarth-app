import axios from "axios";

// =====================================================
// API BASE URL
// =====================================================
//
// Local development:
//   http://localhost:5000/api
//
// Production:
//   Use VITE_API_BASE_URL when provided.
//
// IMPORTANT:
// A relative "/api" in local Vite development points to
// the frontend dev server unless Vite proxy is configured.
// =====================================================

const configuredApiUrl =
  String(
    import.meta.env.VITE_API_BASE_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

const isAbsoluteUrl =
  /^https?:\/\//i.test(
    configuredApiUrl
  );

const API_BASE_URL =
  import.meta.env.DEV
    ? (
        isAbsoluteUrl
          ? configuredApiUrl
          : "http://localhost:5000/api"
      )
    : (
        configuredApiUrl ||
        "/api"
      );

// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
  baseURL:
    API_BASE_URL,

  headers: {
    "Content-Type":
      "application/json",
  },

  timeout: 15000,
});

// =====================================================
// ATTACH ADMIN JWT
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "adminToken"
      );

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(
      error
    )
);

// =====================================================
// GLOBAL RESPONSE HANDLER
// =====================================================

api.interceptors.response.use(
  (response) =>
    response,

  (error) => {
    // ---------------------------------------------------
    // AUTHENTICATION FAILURE
    // ---------------------------------------------------

    if (
      error.response?.status ===
      401
    ) {
      localStorage.removeItem(
        "adminToken"
      );

      localStorage.removeItem(
        "adminUser"
      );

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    return Promise.reject(
      error
    );
  }
);

// =====================================================
// DEVELOPMENT DEBUG
// =====================================================

if (
  import.meta.env.DEV
) {
  console.log(
    "🔗 Admin API Base URL:",
    API_BASE_URL
  );
}

// =====================================================
// EXPORT
// =====================================================

export default api;