import { Menu, Bell, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Header = ({ setOpen }) => {
  const { admin } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden lg:block">
        <h2 className="text-lg font-semibold text-slate-800">
          Admin Dashboard
        </h2>

        <p className="text-xs text-slate-500">
          Manage your Samarth platform
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex">
          <UserCircle className="h-8 w-8 text-blue-600" />

          <div>
            <p className="text-sm font-semibold text-slate-700">
              {admin?.name || "Admin"}
            </p>

            <p className="text-xs capitalize text-slate-400">
              {admin?.role || "admin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;