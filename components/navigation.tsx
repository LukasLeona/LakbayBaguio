"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, House, Lightbulb, MessageSquare, Radar, Route, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ITINERARY_CHANGE_EVENT, ITINERARY_STORAGE_KEY } from "@/lib/itinerary";
import { UnreadBadge, useChatNotifications } from "./chat-notifications";

const mobileNavItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/plan", label: "Itinerary", icon: CalendarCheck2 },
  { href: "/nearby", label: "Nearby", icon: Radar },
  { href: "/chats", label: "Chats", icon: MessageSquare },
];

const desktopNavItems = [
  ...mobileNavItems.slice(0, 4),
  { href: "/suggestions", label: "Suggestions", icon: Lightbulb },
  mobileNavItems[4],
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function hasStoredItinerary() {
  try {
    const raw = localStorage.getItem(ITINERARY_STORAGE_KEY);
    if (!raw) return false;
    const candidate = JSON.parse(raw) as { days?: unknown; numberOfDays?: unknown; stops?: unknown };
    return (Array.isArray(candidate.days) && typeof candidate.numberOfDays === "number")
      || (Array.isArray(candidate.stops) && typeof candidate.days === "number");
  } catch {
    return false;
  }
}

function usePendingItinerary(pathname: string) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const update = () => setPending(hasStoredItinerary());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === ITINERARY_STORAGE_KEY) update();
    };
    update();
    window.addEventListener("storage", onStorage);
    window.addEventListener(ITINERARY_CHANGE_EVENT, update);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ITINERARY_CHANGE_EVENT, update);
    };
  }, [pathname]);

  return pending;
}

export function SiteHeader() {
  const pathname = usePathname();
  const isPlanPage = pathname.startsWith("/plan");
  const hasPending = usePendingItinerary(pathname);
  const { unreadCount } = useChatNotifications();

  return (
    <header className={`site-header ${isPlanPage ? "plan-context" : ""}`}>
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Baguio Buddy home">
          <img src="/assets/img/favicon.svg" alt="" width="38" height="38" />
          <span>
            <strong>Baguio</strong>
            <small>Buddy</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {desktopNavItems.map(({ href, label }) => {
            const destination = href === "/plan" && hasPending ? "/plan/itinerary" : href;
            return <Link key={href} href={destination} className={isActive(pathname, href) ? "active" : ""} title={href === "/plan" && hasPending ? "View your pending itinerary" : undefined}>{label}{href === "/plan" && hasPending ? <i className="desktop-pending-dot" aria-hidden="true" /> : null}{href === "/chats" && unreadCount > 0 ? <UnreadBadge className="desktop-unread-badge" /> : null}</Link>;
          })}
        </nav>

        {!isPlanPage ? (
          <Link href="/plan" className="header-action">
            Build itinerary
            <Route size={17} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  const hasPending = usePendingItinerary(pathname);
  const { unreadCount } = useChatNotifications();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {mobileNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        const destination = href === "/plan" && hasPending ? "/plan/itinerary" : href;
        return (
          <Link key={href} href={destination} className={active ? "active" : ""} aria-current={active ? "page" : undefined} aria-label={href === "/plan" && hasPending ? "Itinerary, pending trip available" : href === "/chats" && unreadCount ? `Chats, ${unreadCount} unread messages` : label}>
            <span className="bottom-icon">
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
              {href === "/plan" && hasPending ? <i className="nav-pending-dot" aria-hidden="true" /> : null}
              {href === "/chats" ? <UnreadBadge /> : null}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
