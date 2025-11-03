// utils/apiFetch.js

export const apiFetch = async (endpoint, options = {}) => {
  try {
    // Base URL (works with your rewrite in next.config)
    const url = endpoint.startsWith("/api") ? endpoint : `/api/${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem("bgvToken");

    // Merge headers
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Perform request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errMsg = "Request failed";
      try {
        const errData = await response.json();
        errMsg = errData.detail || errData.message || errMsg;
      } catch {}
      throw new Error(`${response.status} - ${errMsg}`);
    }

    // Try parsing JSON
    try {
      return await response.json();
    } catch {
      return null;
    }
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error.message);
    throw error;
  }
};
