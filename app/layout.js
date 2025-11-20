// app/layout.jsx
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Maihoo Admin",
  description: "Background Verification Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
