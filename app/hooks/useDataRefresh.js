"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to detect when data should be refreshed after API mutations
 * Usage: Call triggerRefresh() after successful API operations (add, update, delete)
 */
export function useDataRefresh(fetchFunction, dependencies = []) {
  const refreshTrigger = useRef(0);

  useEffect(() => {
    if (refreshTrigger.current > 0) {
      fetchFunction();
    }
  }, [refreshTrigger.current, ...dependencies]);

  const triggerRefresh = () => {
    refreshTrigger.current += 1;
  };

  return { triggerRefresh };
}

/**
 * Hook to automatically refresh data at intervals
 * Usage: useAutoRefresh(fetchFunction, 30000) // refresh every 30 seconds
 */
export function useAutoRefresh(fetchFunction, intervalMs = 60000) {
  useEffect(() => {
    if (!intervalMs) return;

    const interval = setInterval(() => {
      fetchFunction();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [fetchFunction, intervalMs]);
}
