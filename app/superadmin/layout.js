"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { logout } from "@/utils/logout";
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
  ScanSearch,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const { user: ctxUser } = useContext(useAuth) || {};
  const [user, setUser] = useState(ctxUser || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoSrc] = useState("/logos/maihooMain.png");
  const profileRef = useRef(null);

  /* Load user from localStorage */
  useEffect(() => {
    if (!ctxUser) {
      try {
        const stored = localStorage.getItem("bgvUser");
        if (stored) setUser(JSON.parse(stored));
      } catch (e) {
        console.warn("Error loading user:", e);
      }
    }
  }, [ctxUser]);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Navigation Links */
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
    { name: "AI Screening", href: "/superadmin/AI-screening", icon: Brain },
    {
      name: "AI-CV-Verification",
      href: "/superadmin/AI-CV-Verification",
      icon: ScanSearch,
    },
    { name: "Invoices", href: "/superadmin/invoices", icon: Receipt },
    {
      name: "Support & Help Desk",
      href: "/superadmin/help-desk",
      icon: Headset,
    },
    { name: "Logs", href: "/superadmin/logs", icon: FileBarChart },
    { name: "Reports", href: "/superadmin/reports", icon: FileText },
  ];

  /* Filter menus based on role */
  const role = user?.role?.toUpperCase() || "";
  let filteredLinks = [...links];

  if ((role === "HELPER") & (role === "ORG_HR")) {
    filteredLinks = filteredLinks.filter(
      (l) =>
        ![
          "/superadmin/logs",
          "/superadmin/invoices",
          "/superadmin/users",
        ].includes(l.href)
    );
  }

  if (role === "SUPER_ADMIN_HELPER") {
    filteredLinks = filteredLinks.filter(
      (l) =>
        ![
          "/superadmin/invoices",
          "/superadmin/logs",
          "/superadmin/organizations",
        ].includes(l.href)
    );
  }

  /* ---------- Logout Confirmation ---------- */
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setLoggingOut(true);

    setTimeout(() => {
      logout(); // using your utils/logout
    }, 4000);
  };

  const displayName = user?.userName || user?.email || "Super Admin";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ---------------- Sidebar ---------------- */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
      >
        <div className="p-2 h-full flex flex-col">
          {/* Logo */}
          <header className="w-full flex justify-center items-center  bg-transparent">
            <Image
              src={logoSrc}
              alt="Logo"
              width={120} // smaller width
              height={30} // smaller height
              priority
              className="hover:scale-105 transition-transform duration-300"
            />
          </header>

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto sidebar-scroll pr-2 mt-4"
            style={{ maxHeight: "calc(100vh - 180px)", paddingBottom: "20px" }}
          >
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

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
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* ---- Logout Button ---- */}
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
        ></div>
      )}

      {/* ---------------- Main Section ---------------- */}
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
                  className="block w-full text-left text-black px-4 py-2 hover:bg-gray-100"
                >
                  Manage Profile
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ---------------- Logout Confirmation Modal ---------------- */}
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

        {/* ---------------- Logout Loading Screen ---------------- */}
        {loggingOut && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-white to-gray-100 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]">
            <div className="animate-spin h-16 w-16 rounded-full border-4 border-[#ff004f] border-t-transparent mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-700 animate-pulse">
              Logging out…
            </h3>
          </div>
        )}

        {/* ---------------- Main Content ---------------- */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16 custom-scroll"
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
