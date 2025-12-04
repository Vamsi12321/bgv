// utils/apiFetch.js

export const apiFetch = async (endpoint, options = {}) => {
  try {
    // Remove leading slash if present and route through proxy
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    const url = `/api/proxy/${cleanEndpoint}`;

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
      credentials: "include", // Important for cookies
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
