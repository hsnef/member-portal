import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { TestDataProvider } from "@/lib/context/TestDataContext";
import { ThemeProvider } from "@/lib/themes/components/ThemeProvider";
import { AppFooter } from "@/components/AppFooter";

// Instrument Sans carries the interface. Instrument Serif is reserved for
// page titles and greetings; it ships a single weight (400) and must never be
// given font-bold — app/globals.css locks the weight and disables synthesis.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

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
  themeColor: "#c75b12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans flex flex-col min-h-screen">
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
