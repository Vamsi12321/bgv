"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  ClipboardList,
  UserCheck,
  LogOut,
  UserCircle2,
  Menu,
  X,
  FileBarChart,
  Building,
  Brain,
  UserSearch,
} from "lucide-react";

export default function OrgAdminLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState(null); // <-- load user from localStorage
  const profileRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("bgvUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const displayName =
    user?.userName || user?.name || user?.userName || "Org Admin";

  /* ----------------------- Close profile menu outside ----------------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ----------------------- Org Admin Sidebar Links ----------------------- */
  const links = [
    { name: "Dashboard", href: "/org/dashboard", icon: LayoutDashboard },
    { name: "organization", href: "/org/organization", icon: Building },
    { name: "Users & Roles", href: "/org/users", icon: Users },
    { name: "Verifications", href: "/org/verifications", icon: ClipboardList },
    {
      name: "Manage Candidates",
      href: "/org/manage-candidates",
      icon: UserSearch,
    },
    {
      name: "Background Verification Services",
      href: "/org/bgv-requests",
      icon: ClipboardList,
    },
    {
      name: "Candidate Self-verification",
      href: "/org/self-verification",
      icon: UserCheck,
    },
    {
      name: "AI-Screening",
      href: "/org/AI-screening",
      icon: Brain,
    },
    { name: "Reports", href: "/org/reports", icon: FileText },
    { name: "Invoices", href: "/org/invoices", icon: Receipt },
    { name: "Logs", href: "/org/logs", icon: FileBarChart },
  ];

  /* ----------------------- Logout Handler ----------------------- */
  const handleLogout = () => {
    if (!confirm("Are you sure you want to logout?")) return;
    try {
      setLoggingOut(true);
      localStorage.removeItem("bgvUser");
      document.cookie =
        "bgvTemp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
      sessionStorage.clear();
      setIsSidebarOpen(false);

      setTimeout(() => {
        window.location.replace("/");
      }, 300);
    } catch (err) {
      console.error("Logout error:", err);
      window.location.replace("/");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col justify-between h-full overflow-y-auto">
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-center border-b border-gray-100">
            <h1 className="text-2xl font-bold text-[#ff004f] font-[cursive] tracking-wide">
              {user?.organizationName || "Org Panel"}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col space-y-1 py-6 px-3">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-[#ff004f] text-white font-semibold shadow"
                      : "text-gray-700 hover:bg-gray-100 hover:text-[#ff004f]"
                  }`}
                >
                  <Icon size={18} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left text-gray-700 hover:bg-gray-100 hover:text-[#ff004f] rounded-md px-3 py-2 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300 relative">
        {/* Header */}
        <header className="fixed top-0 left-0 md:left-64 right-0 bg-white text-gray-800 px-4 sm:px-8 py-4 flex justify-between items-center shadow-md border-b border-gray-100 z-20">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-gray-700 hover:text-[#ff004f] transition"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={26} /> : <Menu size={26} />}
            </button>

            <h1 className="text-lg sm:text-xl font-semibold tracking-wide">
              Welcome, <span className="text-[#ff004f]">{displayName}</span>
            </h1>
          </div>

          {/* Profile Menu */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative" ref={profileRef}>
              <UserCircle2
                size={36}
                className="text-gray-600 hover:text-[#ff004f] cursor-pointer transition"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
              />
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b text-sm text-gray-700">
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-gray-500 text-xs">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      alert("Opening Profile Settings...");
                      setProfileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Manage Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Logging Out Overlay */}
        {loggingOut && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-white to-gray-100 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] transition-opacity">
            <div className="animate-spin h-16 w-16 rounded-full border-4 border-[#ff004f] border-t-transparent mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-700 animate-pulse">
              Logging out…
            </h3>
          </div>
        )}

        {/* Main Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
