// app/layout.jsx
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Maihoo Admin",
  description: "Background Verification Platform",

  icons: {
    icon: "/logos/maihooMain.png", // favicon
    shortcut: "/logos/maihooMain.png",
    apple: "/logos/maihooMain.png", // iOS home screen (optional)
  },
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
