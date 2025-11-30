export function logout() {
  // Clear localStorage
  localStorage.removeItem("bgvUser");

  // Clear cookies client-side
  document.cookie = "bgvUser=; Path=/; Max-Age=0;";
  document.cookie = "bgvSession=; Path=/; Max-Age=0;";
  document.cookie = "bgvTemp=; Path=/; Max-Age=0;";

  // Call backend logout endpoint to clear httpOnly cookies
  fetch("https://maihoo.onrender.com/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch((error) => {
    console.error("Error calling backend logout:", error);
  });

  // Redirect to login
  window.location.href = "/login";
}
