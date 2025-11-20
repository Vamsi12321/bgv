"use client";

import { useState, useRef, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  ClipboardList,
  UserCheck,
  LogOut,
  UserCircle2,
  Menu,
  X,
  Headset,
  CheckCheck,
  FileBarChart,
  Brain,
  UserSearch,
} from "lucide-react";
// If you have a global AuthContext
import { useAuth } from "../context/AuthContext";

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const { user: ctxUser } = useContext(useAuth) || {}; // optional if you have context
  const [user, setUser] = useState(ctxUser || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/logos/maihoo.png");
  const profileRef = useRef(null);

  /* ------------------------------------------
   🔹 Load user instantly from localStorage
  ------------------------------------------ */
  useEffect(() => {
    if (!ctxUser) {
      try {
        const stored = localStorage.getItem("bgvUser");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        }
      } catch (e) {
        console.warn("Error loading user from storage:", e);
      }
    }
  }, [ctxUser]);

  /* ------------------------------------------
   🔹 Close profile dropdown on outside click
  ------------------------------------------ */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = [
    { name: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
    {
      name: "Organizations",
      href: "/superadmin/organizations",
      icon: Building2,
    },
    { name: "Users & Roles", href: "/superadmin/users", icon: Users },
    {
      name: "Manage Candidates",
      href: "/superadmin/manage-candidates",
      icon: UserSearch,
    },
    {
      name: "Verifications",
      href: "/superadmin/verifications",
      icon: CheckCheck,
    },
    {
      name: "Background Verification Services",
      href: "/superadmin/bgv-requests",
      icon: ClipboardList,
    },
    {
      name: "Candidate Self-verification",
      href: "/superadmin/self-verification",
      icon: UserCheck,
    },
    {
      name: "AI Screening",
      href: "/superadmin/AI-screening",
      icon: Brain, // lucide-react icon
    },
    { name: "Invoices", href: "/superadmin/invoices", icon: Receipt },
    {
      name: "Support & Help Desk",
      href: "/superadmin/help-desk",
      icon: Headset,
    },
    { name: "Logs", href: "/superadmin/logs", icon: FileBarChart },
    {
      name: "Reports",
      href: "/superadmin/reports",
      icon: FileText,
    },
  ];

  /* ------------------------------------------
   🔹 Handle Logout
  ------------------------------------------ */
  const handleLogout = () => {
    if (!confirm("Are you sure you want to logout?")) return;

    try {
      setLoggingOut(true);
      localStorage.removeItem("bgvUser");
      sessionStorage.clear();
      document.cookie =
        "bgvTemp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      setTimeout(() => {
        window.location.replace("/");
      }, 400);
    } catch (err) {
      console.error("Logout cleanup error:", err);
      window.location.replace("/");
    }
  };

  /* ------------------------------------------
   🔹 Determine welcome message
  ------------------------------------------ */
  const displayName = user?.userName || user?.email || "Super Admin";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-2 flex flex-col justify-between h-full overflow-y-auto">
          {/* Logo */}
          <header className="w-full p-2 flex justify-start items-center">
            <Image
              src={logoSrc}
              alt={` Logo`}
              width={140}
              height={40}
              priority
              className="bg-transparent hover:scale-105 transition-transform duration-300"
            />
          </header>

          {/* Navigation */}
          <nav className="flex flex-col space-y-2 mt-4">
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
          <div className="mt-8 border-t border-gray-200 pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#ff004f] rounded-md transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
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

            {/* ✅ Show user name instantly without flicker */}
            {user ? (
              <h1 className="text-lg sm:text-xl font-semibold tracking-wide text-gray-800">
                Welcome,{" "}
                <span className="text-[#ff004f]">
                  {displayName.split(" ")[0] || displayName}
                </span>
              </h1>
            ) : (
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>

          {/* Right section */}
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
                      window.location.href = "/superadmin/manage-profile";
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

        {/* Logging out overlay */}
        {loggingOut && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-white to-gray-100 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] transition-opacity">
            <div className="animate-spin h-16 w-16 rounded-full border-4 border-[#ff004f] border-t-transparent mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-700 animate-pulse">
              Logging out…
            </h3>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
