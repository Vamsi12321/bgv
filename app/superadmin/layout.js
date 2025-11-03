"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  HelpCircle,
  CheckCheck,
  Headset,
} from "lucide-react";

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // 🔹 Close profile menu when clicking outside
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

    { name: "Invoices", href: "/superadmin/invoices", icon: Receipt },
    {
      name: "Support&Help-desk",
      href: "/superadmin/help-desk",
      icon: Headset,
    },
    { name: "Logs", href: "/superadmin/logs", icon: Receipt },
    {
      name: "Reports",
      href: "/superadmin/reports",
      icon: FileText, // you can change to BarChart3 if you want analytics-style
    },
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
  md:translate-x-0`}
      >
        <div className="p-2 flex flex-col justify-between  overflow-y-auto">
          {/* Logo at the top */}
          <div className="p-2 flex items-center justify-center ml-7 ">
            <div className=" w-full text-left ">
              <h1 className="text-3xl font-[cursive] font-bold text-[#ff004f] ">
                Maihoo
              </h1>
            </div>
          </div>
          {/* Navigation Links */}
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
            <h1 className="text-lg sm:text-xl font-semibold tracking-wide">
              Welcome, Super Admin
            </h1>
          </div>
          {/* Right section */}

          <div className="flex items-center gap-4 sm:gap-6">
            {/* <div className="w-22 h-8 bg-white border-1 border-[#ff004f] rounded-4xl flex items-center justify-center p-1">
              <img
                src="/logos/maihooLogo.png"
                alt="Maihoo Logo"
                className="w-16 h-16 rounded-lg object-cover cursor-pointer"
              />
            </div> */}

            {/* 👤 Profile with dropdown */}
            <div className="relative" ref={profileRef}>
              <UserCircle2
                size={36}
                className="text-gray-600 hover:text-[#ff004f] cursor-pointer transition"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
              />

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 mt-[80px]">
          {children}
        </main>
      </div>
    </div>
  );
}
