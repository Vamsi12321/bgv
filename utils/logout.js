/**
 * Logout utility function
 * Clears user session and redirects to login page
 */
export async function logout() {
  try {
    // Clear cookies via API
    await fetch("/api/auth/clear-cookies", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Error clearing cookies:", error);
  }

  // Clear localStorage
  try {
    localStorage.removeItem("bgvUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }

  // Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error("Error clearing sessionStorage:", error);
  }

  // Redirect to login page
  window.location.href = "/login";
}
