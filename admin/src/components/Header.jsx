import { Menu, Bell, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Header = ({ setOpen, notificationCount = 0, onNotificationsClick }) => {
  const { admin } = useAuth();
  const name = admin?.name || "Admin";
  const role = admin?.role || "admin";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:px-6 lg:h-20">
        {/* Menu button (mobile / tablet) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold leading-tight text-slate-800 sm:text-lg">
            Admin Dashboard
          </h2>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            Manage your Samarth platform
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={onNotificationsClick}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 active:bg-slate-200"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* Profile: avatar always visible, text from sm up */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-4">
            <UserCircle className="h-8 w-8 shrink-0 text-blue-600 sm:h-9 sm:w-9" />
            <div className="hidden min-w-0 max-w-[140px] sm:block">
              <p className="truncate text-sm font-semibold leading-tight text-slate-700">
                {name}
              </p>
              <p className="truncate text-xs capitalize text-slate-400">
                {role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;