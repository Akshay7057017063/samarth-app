import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Customer from "./pages/customer/Customer";
import EditCustomer from "./pages/customer/EditCustomer";
import CustomerDetails from "./pages/customer/CustomerDetails";
import CaptchaWork from "./pages/captcha/CaptchaWork";
import Wallets from "./pages/wallet/Wallets";
import PaymentReport from "./pages/reports/PaymentReport";
import DeviceRequests from "./pages/devices/DeviceRequests";

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
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/customers" element={<Customer />} />
          <Route
  path="/customers/:id/edit"
  element={<EditCustomer />}
/>

          <Route
            path="/customers/:id"
            element={<CustomerDetails />}
          />

          <Route path="/captcha" element={<CaptchaWork />} />

          <Route path="/wallets" element={<Wallets />} />

          <Route path="/devices" element={<DeviceRequests />} />

          <Route
            path="/reports"
            element={<PaymentReport />}
          />

          <Route
            path="/settings"
            element={<Placeholder title="Settings" />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default App;