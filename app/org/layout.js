"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/utils/logout";
import { OrgStateProvider } from "../context/OrgStateContext";

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
  ScanSearch,
  Headset,
  Sparkles,
  ClipboardListIcon,
} from "lucide-react";

export default function OrgAdminLayout({ children }) {
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const profileRef = useRef(null);

  /* Load user */
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  /* Fetch Org */
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await fetch(`/api/proxy/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.organizations?.length) {
          setOrg(data.organizations[0]);
        }
      } catch (err) {
        console.error("Org fetch error:", err);
      }
    };
    fetchOrg();
  }, []);

  const logoSrc =
    org?.logoUrl && org.logoUrl.trim() !== ""
      ? org.logoUrl
      : "/default-logo.png";

  const displayName =
    user?.userName || user?.email || user?.name || "Org Admin";

  /* Close profile menu */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------- BADGE STYLING (CONSISTENT & COMPACT) ---------- */
  const AIBadgeInactive = () => (
    <span
      className="ml-auto px-2 py-1 text-[10px] font-bold rounded-full 
      bg-pink-50 text-[#ff004f] border border-pink-200 inline-flex items-center gap-1 whitespace-nowrap flex-shrink-0"
    >
      <Sparkles size={11} className="text-[#ff004f]" />
      AI
    </span>
  );

  const AIBadgeActive = () => (
    <span
      className="ml-auto px-2 py-1 text-[10px] font-bold rounded-full 
      bg-white text-[#ff004f] inline-flex items-center gap-1 shadow-sm whitespace-nowrap flex-shrink-0"
    >
      <Sparkles size={11} className="text-[#ff004f]" />
      AI
    </span>
  );

  /* Sidebar Links */
  const links = [
    { name: "Dashboard", href: "/org/dashboard", icon: LayoutDashboard },
    { name: "Organization", href: "/org/organization", icon: Building },
    { name: "Users & Roles", href: "/org/users", icon: Users },
    { name: "Verifications", href: "/org/verifications", icon: ClipboardList },
    {
      name: "Manage Candidates",
      href: "/org/manage-candidates",
      icon: UserSearch,
    },
    {
      name: "Bgv Services",
      href: "/org/bgv-requests",
      icon: ClipboardListIcon,
    },
    {
      name: "Candidate Self-verification",
      href: "/org/self-verification",
      icon: UserCheck,
    },

    // ⭐ STANDARDIZED NAMES — SAME AS SUPERADMIN
    { name: "AI Screening", href: "/org/AI-screening", icon: Brain },
    {
      name: "AI CV Validation",
      href: "/org/AI-CV-Verification",
      icon: ScanSearch,
    },
    {
      name: "AI Edu Validation",
      href: "/org/AI-Edu-Verification",
      icon: Sparkles,
    },

    { name: "Support & Help Desk", href: "/org/help-desk", icon: Headset },
    { name: "Reports", href: "/org/reports", icon: FileText },
    // { name: "Invoices", href: "/org/invoices", icon: Receipt },
    { name: "Logs", href: "/org/logs", icon: FileBarChart },
  ];

  /* Role Filtering */
  const role = user?.role?.toUpperCase() || "";
  let filteredLinks = [...links];

  if (role === "HELPER") {
    filteredLinks = filteredLinks.filter(
      (l) =>
        ![
          "/org/logs",
          "/org/invoices",
          "/org/users",
          "/org/organization",
        ].includes(l.href)
    );
  }

  /* Logout */
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setLoggingOut(true);

    setTimeout(() => {
      logout();
    }, 4000);
  };

  return (
    <OrgStateProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* ---------------- Sidebar - Compact ---------------- */}
        <aside
          className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 shadow-sm 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0`}
        >
          <div className="h-full flex flex-col">
            {/* Logo - Centered */}
            <header className="w-full py-3 px-4 flex justify-center items-center">
              <img
                src={logoSrc}
                alt="Logo"
                className="w-[50px] h-[50px] rounded-full object-cover shadow-sm hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = "/default-logo.png";
                }}
              />
            </header>

            {/* Navigation - Optimized Vertical Space */}
            <nav
              className="flex-1 overflow-y-auto sidebar-scroll px-2"
              style={{
                maxHeight: "calc(100vh - 90px)",
                paddingBottom: "4px",
              }}
            >
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                const isAIPage = [
                  "/org/AI-screening",
                  "/org/AI-CV-Verification",
                  "/org/AI-Edu-Verification",
                ].includes(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 mb-0.5 rounded-xl transition-all whitespace-nowrap text-sm group
                      ${
                        isActive
                          ? "bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white font-bold shadow-lg scale-[1.02]"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-[#ff004f] font-semibold hover:scale-[1.01]"
                      }`}
                  >
                    {Icon && <Icon size={20} className="flex-shrink-0" />}
                    <span className="flex-1 whitespace-nowrap">
                      {link.name}
                    </span>
                    {isAIPage &&
                      (isActive ? <AIBadgeActive /> : <AIBadgeInactive />)}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t-2 border-gray-200 pt-2 mt-1.5 px-2">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 
                hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 rounded-xl transition-all font-bold shadow-sm hover:shadow-md hover:scale-[1.01]"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 backdrop-blur-[2px] bg-transparent z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300 relative">
          {/* SUPERB ENHANCED HEADER */}
          <header
            className="fixed top-0 left-0 md:left-64 right-0 bg-gradient-to-r from-white via-gray-50 to-white px-4 sm:px-6 py-3.5
            flex justify-between items-center shadow-lg border-b-2 border-gray-100 z-20 h-16"
          >
            <div className="flex items-center gap-4">
              <button
                className="md:hidden text-gray-700 hover:text-[#ff004f] transition-colors p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X size={26} /> : <Menu size={26} />}
              </button>

              <div className="flex items-center gap-3">
                <UserCircle2
                  size={32}
                  className="hidden sm:block text-[#ff004f] flex-shrink-0"
                  strokeWidth={2}
                />
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">
                    Welcome back,{" "}
                    <span className="bg-gradient-to-r from-[#ff004f] to-[#ff3366] bg-clip-text text-transparent">
                      {displayName.split(" ")[0]}
                    </span>
                    ! 👋
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block font-medium">
                    Have a productive day
                  </p>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#ff004f] to-[#ff3366] rounded-full flex items-center justify-center shadow-md">
                  <UserCircle2 size={20} className="text-white" />
                </div>
                <span className="hidden sm:block text-sm font-semibold text-gray-700">
                  {displayName.split(" ")[0]}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <p className="font-bold text-gray-800">{displayName}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {user?.email}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white text-xs font-bold rounded-full">
                      {user?.role || "Admin"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      window.location.href = "/org/manage-profile";
                      setProfileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 hover:bg-gradient-to-r hover:from-[#ff004f]/10 hover:to-[#ff3366]/10 text-gray-700 hover:text-[#ff004f] transition-all font-medium"
                  >
                    ⚙️ Manage Profile
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Logout Loading Screen */}
          {loggingOut && (
            <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-white to-gray-100 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]">
              <div className="animate-spin h-16 w-16 rounded-full border-4 border-[#ff004f] border-t-transparent mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-700 animate-pulse">
                Logging out…
              </h3>
            </div>
          )}

          {/* Logout Modal - SUPERB UI */}
          {showLogoutModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[90%] text-center transform animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                  <LogOut size={40} className="text-red-600" />
                </div>

                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                  Confirm Logout
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Are you sure you want to logout from your account?
                  <br />
                  You'll need to sign in again to access your dashboard.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmLogout}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    Yes, Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- Main Content - Adjusted for New Header ---- */}
          <main
            className="flex-1 overflow-y-auto p-3 sm:p-4 mt-16 custom-scroll"
            style={{ maxHeight: "calc(100vh - 64px)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </OrgStateProvider>
  );
}
