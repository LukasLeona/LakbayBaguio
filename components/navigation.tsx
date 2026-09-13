"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, House, MessageSquare, Radar, Route, Search } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/plan", label: "Plan", icon: CalendarCheck2 },
  { href: "/nearby", label: "Nearby", icon: Radar },
  { href: "/chats", label: "Chats", icon: MessageSquare },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const isPlanPage = pathname.startsWith("/plan");

  return (
    <header className={`site-header ${isPlanPage ? "plan-context" : ""}`}>
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Lakbay Baguio home">
          <img src="/assets/img/favicon.svg" alt="" width="38" height="38" />
          <span>
            <strong>Lakbay</strong>
            <small>Baguio</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href} className={isActive(pathname, href) ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>

        {!isPlanPage ? (
          <Link href="/plan" className="header-action">
            Plan a trip
            <Route size={17} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <span className="bottom-icon">
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
