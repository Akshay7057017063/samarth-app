import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const savedUser = localStorage.getItem("adminUser");

      if (!savedUser) {
        return null;
      }

      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Failed to load admin user:", error);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (loginId, password) => {
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        loginId,
        password,
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      const user = data.user;

      // Only admin and superadmin can enter admin panel
      if (user.role !== "admin" && user.role !== "superadmin") {
        throw new Error("You do not have admin access.");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(user));

      setAdmin(user);

      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(admin),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// IMPORTANT: Named export
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;