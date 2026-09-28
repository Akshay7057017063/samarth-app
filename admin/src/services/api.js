import axios from "axios";

const API_BASE_URL =
import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
baseURL: API_BASE_URL,
headers: {
"Content-Type": "application/json",
},
timeout: 15000,
});

// Attach admin JWT to every request.
api.interceptors.request.use(
(config) => {
const token = localStorage.getItem("adminToken");


if (token) {
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
}

return config;


},
(error) => Promise.reject(error)
);

// Handle authentication failures globally.
api.interceptors.response.use(
(response) => response,
(error) => {
if (error.response?.status === 401) {
localStorage.removeItem("adminToken");
localStorage.removeItem("adminUser");


  // Only redirect when the user is not already on login.
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

return Promise.reject(error);


}
);

export default api;
