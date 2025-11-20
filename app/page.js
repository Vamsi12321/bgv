"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    // ✅ Read user data from localStorage
    const storedUser = localStorage.getItem("bgvUser");
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bgvTemp="));

    // ✅ If user logged in
    if (storedUser && tokenCookie) {
      try {
        const user = JSON.parse(storedUser);
        const role = user.role?.toUpperCase();

        if (["SUPER_ADMIN", "SUPER_ADMIN_HELPER"].includes(role)) {
          router.replace("/superadmin/dashboard");
          return;
        }
        if (["ORG_HR", "HELPER"].includes(role)) {
          router.replace("/org/dashboard");
          return;
        }
      } catch {
        // if parse fails, send to login
        localStorage.removeItem("bgvUser");
      }
    }

    // ❌ Not logged in — send to login page
    router.replace("/login");
  }, [router]);

  return null;
}
