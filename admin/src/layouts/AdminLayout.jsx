import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        open={open}
        setOpen={setOpen}
      />

      {/* Main Content */}
      <div className="min-h-screen lg:ml-72">

        {/* Header */}
        <Header setOpen={setOpen} />

        {/* Page Content */}
        <main className="p-4 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;