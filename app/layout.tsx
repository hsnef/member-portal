import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { TestDataProvider } from "@/lib/context/TestDataContext";
import { ThemeProvider } from "@/lib/themes/components/ThemeProvider";
import { AppFooter } from "@/components/AppFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HSNEF Membership Portal",
  description: "Hindu Society of North East Florida - Member Portal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HSNEF Pass",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FF9933",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <ThemeProvider>
            <TestDataProvider>
              <div className="flex-1">
                {children}
              </div>
              <AppFooter />
            </TestDataProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
