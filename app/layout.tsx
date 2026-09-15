import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { BottomNavigation, SiteHeader } from "@/components/navigation";
import { UtilityMenu } from "@/components/utility-menu";
import { ChatNotificationsProvider } from "@/components/chat-notifications";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: { default: "Baguio Buddy", template: "%s · Baguio Buddy" },
  description: "Discover Baguio, build an itinerary, and meet nearby travelers with privacy-first controls.",
  icons: { icon: "/assets/img/favicon.svg?v=baguio-buddy" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={poppins.variable}>
        <ChatNotificationsProvider>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <SiteHeader />
          <UtilityMenu />
          {children}
          <BottomNavigation />
        </ChatNotificationsProvider>
      </body>
    </html>
  );
}
