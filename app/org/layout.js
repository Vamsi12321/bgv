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

  /* ---------------- AI Badge Components ---------------- */
  const AIBadgeInactive = () => (
    <span
      className="ml-2 px-2 py-[3px] text-[10px] font-semibold rounded-full 
      bg-pink-50 text-[#ff004f] border border-pink-200 inline-flex items-center gap-1 whitespace-nowrap"
    >
      <Sparkles size={10} className="text-[#ff004f]" />
      AI Powered
    </span>
  );

  const AIBadgeActive = () => (
    <span
      className="ml-2 px-2 py-[3px] text-[10px] font-semibold rounded-full 
      bg-white text-[#ff004f] inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
    >
      <Sparkles size={10} className="text-[#ff004f]" />
      AI Powered
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

    { name: "Support & Help Desk", href: "/org/help-desk", icon: Headset },
    { name: "Reports", href: "/org/reports", icon: FileText },
    { name: "Invoices", href: "/org/invoices", icon: Receipt },
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
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
            md:translate-x-0`}
        >
          <div className="h-full flex flex-col p-2">
            {/* Logo */}
            <header className="w-full p-3 flex justify-center items-center border-b border-gray-100">
              <img
                src={logoSrc}
                alt="Logo"
                className="w-[70px] h-[70px] rounded-full object-cover border border-gray-200 shadow-sm"
                onError={(e) => {
                  e.target.src = "/default-logo.png";
                }}
              />
            </header>

            {/* Navigation */}
            <nav
              className="flex-1 overflow-y-auto pr-2 mt-4 sidebar-scroll"
              style={{
                maxHeight: "calc(100vh - 180px)",
                paddingBottom: "20px",
              }}
            >
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                const isAI =
                  link.href === "/org/AI-screening" ||
                  link.href === "/org/AI-CV-Verification";

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md transition 
                      ${
                        isActive
                          ? "bg-[#ff004f] text-white font-semibold shadow"
                          : "text-gray-700 hover:bg-gray-100 hover:text-[#ff004f]"
                      }`}
                  >
                    <Icon size={18} />

                    <span className="flex items-center whitespace-nowrap">
                      {link.name}
                      {isAI &&
                        (isActive ? <AIBadgeActive /> : <AIBadgeInactive />)}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#ff004f] rounded-md transition"
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
            className="fixed inset-0 backdrop-blur-[2px] bg-transparent z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300 relative">
          {/* Header */}
          <header className="fixed top-0 left-0 md:left-64 right-0 bg-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-md border-b border-gray-100 z-20">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden text-gray-700 hover:text-[#ff004f]"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X size={26} /> : <Menu size={26} />}
              </button>

              <h1 className="text-lg sm:text-xl font-semibold text-gray-800 p-4">
                Welcome,{" "}
                <span className="text-[#ff004f]">
                  {displayName.split(" ")[0]}
                </span>
              </h1>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <UserCircle2
                size={36}
                className="text-gray-600 hover:text-[#ff004f] cursor-pointer"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              />

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b text-sm text-gray-700">
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-gray-500 text-xs">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      window.location.href = "/org/manage-profile";
                      setProfileMenuOpen(false);
                    }}
                    className="block w-full text-left text-black px-4 py-2 hover:bg-gray-100"
                  >
                    Manage Profile
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

          {/* Logout Modal */}
          {showLogoutModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
              <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center">
                <h2 className="text-lg font-semibold mb-3">Are you sure?</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Do you really want to logout from your account?
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmLogout}
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Yes, Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN PAGE CONTENT */}
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16 custom-scroll"
            style={{ maxHeight: "calc(100vh - 80px)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </OrgStateProvider>
  );
}
