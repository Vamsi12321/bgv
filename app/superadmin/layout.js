"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { logout } from "@/utils/logout";
import { usePathname } from "next/navigation";
import { SuperAdminStateProvider } from "../context/SuperAdminStateContext";

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
  Sparkles,
  ClipboardListIcon,
  GraduationCap,
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

  /* Navigation Links (Standardized names) */
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
      name: "Bgv Services",
      href: "/superadmin/bgv-requests",
      icon: ClipboardListIcon,
    },
    {
      name: "Candidate Self-verification",
      href: "/superadmin/self-verification",
      icon: UserCheck,
    },

    // 🔥 STANDARDIZED TEXT
    { name: "AI Screening", href: "/superadmin/AI-screening", icon: Brain },
    {
      name: "AI CV Validation",
      href: "/superadmin/AI-CV-Verification",
      icon: ScanSearch,
    },
    {
      name: "AI Edu Validation",
      href: "/superadmin/AI-Edu-Verification",
      icon: GraduationCap, // Or choose a better icon like GraduationCap if you want
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

  /* ---------- BADGE STYLING (CONSISTENT) ---------- */
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

  /* ---------- Logout Confirmation ---------- */
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setLoggingOut(true);
    setTimeout(() => logout(), 4000);
  };

  const displayName = user?.userName || user?.email || "Super Admin";

  return (
    <SuperAdminStateProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* ---------------- Sidebar ---------------- */}
        <aside
          className={`fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-gray-200 shadow-sm 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0`}
        >
          <div className="p-2 h-full flex flex-col">
            {/* Logo */}
            <header className="w-full flex justify-center items-center bg-transparent py-2">
              <Image
                src={logoSrc}
                alt="Logo"
                width={120}
                height={30}
                priority
                className="hover:scale-105 transition-transform duration-300"
              />
            </header>

            {/* Navigation */}
            <nav
              className="flex-1 overflow-y-auto sidebar-scroll pr-2 mt-2"
              style={{
                maxHeight: "calc(100vh - 150px)",
                paddingBottom: "20px",
              }}
            >
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                const isAIPage = [
                  "/superadmin/AI-screening",
                  "/superadmin/AI-CV-Verification",
                  "/superadmin/AI-Edu-Verification",
                ].includes(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md transition whitespace-nowrap
                      ${
                        isActive
                          ? "bg-[#ff004f] text-white font-semibold shadow"
                          : "text-gray-700 hover:bg-gray-100 hover:text-[#ff004f]"
                      }`}
                  >
                    <Icon size={18} />

                    <span className="flex items-center whitespace-nowrap">
                      {link.name}
                      {isAIPage &&
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
                className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 
                hover:bg-gray-100 hover:text-[#ff004f] rounded-md transition"
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
          <header
            className="fixed top-0 left-0 md:left-64 right-0 bg-white px-4 sm:px-6 py-2 
            flex justify-between items-center shadow-md border-b border-gray-100 z-20 h-14"
          >
            <div className="flex items-center gap-4">
              <button
                className="md:hidden text-gray-700 hover:text-[#ff004f]"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X size={26} /> : <Menu size={26} />}
              </button>

              <h1 className="text-lg sm:text-xl px-4 font-semibold text-gray-800">
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
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
                  >
                    Manage Profile
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* ---- Main Content ---- */}
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-5 mt-14 custom-scroll"
            style={{ maxHeight: "calc(100vh - 80px)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </SuperAdminStateProvider>
  );
}
