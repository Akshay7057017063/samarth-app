import {
createContext,
useContext,
useState,
} from "react";
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

  localStorage.removeItem("adminUser");
  localStorage.removeItem("adminToken");

  return null;
}


});

const [loading, setLoading] = useState(false);

const login = async (loginId, password) => {
setLoading(true);


try {
  const response = await api.post("/auth/login", {
    loginId: String(loginId || "").trim(),
    password,
  });

  const data = response.data;

  if (!data?.success) {
    throw new Error(
      data?.message || "Login failed."
    );
  }

  if (!data?.token) {
    throw new Error(
      "Login successful, but authentication token was not received."
    );
  }

  const user = data?.user;

  if (!user) {
    throw new Error(
      "Login successful, but administrator information was not received."
    );
  }

  const role = String(user.role || "")
    .trim()
    .toLowerCase();

  // Only administrators can access this frontend.
  if (
    role !== "admin" &&
    role !== "superadmin"
  ) {
    throw new Error(
      "You do not have administrator access."
    );
  }

  // Store token and administrator information.
  localStorage.setItem(
    "adminToken",
    data.token
  );

  localStorage.setItem(
    "adminUser",
    JSON.stringify(user)
  );

  setAdmin(user);

  return data;
} catch (error) {
  console.error("Admin login error:", error);

  throw new Error(
    error.response?.data?.message ||
      error.message ||
      "Unable to login. Please try again."
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

const isAuthenticated = Boolean(
admin &&
localStorage.getItem("adminToken")
);

return (
<AuthContext.Provider
value={{
admin,
loading,
login,
logout,
isAuthenticated,
}}
>
{children}
</AuthContext.Provider>
);
};

export const useAuth = () => {
return useContext(AuthContext);
};

export default AuthContext;
