"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  user: null,
  permissions: [],
  setUser: () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bgvUser");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setUser(parsed);
      setPermissions(
        Array.isArray(parsed.permissions) ? parsed.permissions : []
      );
    } catch (err) {
      console.error("Failed to parse bgvUser from localStorage:", err);
      setUser(null);
      setPermissions([]);
    }

    // listen for localStorage updates (cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === "bgvUser") {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setUser(parsed);
          setPermissions(
            Array.isArray(parsed?.permissions) ? parsed.permissions : []
          );
        } catch {
          setUser(null);
          setPermissions([]);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const hasPermission = (perm) => {
    if (!perm) return true; // if no restriction, always show
    return permissions.includes(perm);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, setUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
