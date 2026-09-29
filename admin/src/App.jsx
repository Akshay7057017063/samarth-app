import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Customer from "./pages/customer/Customer";
import CustomerDetails from "./pages/customer/CustomerDetails";

const Placeholder = ({ title }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          {title}
        </h1>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        This module will be implemented next.
      </p>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* ========================================
          PUBLIC ROUTES
      ======================================== */}

      {/* Admin root ALWAYS opens login */}
      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* ========================================
          PROTECTED ADMIN ROUTES
      ======================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Customers */}
          <Route
            path="/customers"
            element={<Customer />}
          />

          <Route
            path="/customers/:id"
            element={<CustomerDetails />}
          />

          {/* Future Modules */}

          <Route
            path="/captcha"
            element={
              <Placeholder title="Captcha Work" />
            }
          />

          <Route
            path="/wallets"
            element={
              <Placeholder title="Wallets" />
            }
          />

          <Route
            path="/reports"
            element={
              <Placeholder title="Reports" />
            }
          />

          <Route
            path="/settings"
            element={
              <Placeholder title="Settings" />
            }
          />

        </Route>
      </Route>

      {/* ========================================
          UNKNOWN ROUTES
      ======================================== */}

      {/* Any unknown admin URL goes to login */}
      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
};

export default App;