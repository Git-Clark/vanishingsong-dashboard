"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_PAGES: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Calendar", href: "/calendar" },
  { label: "Promo Campaign", href: "/promo-campaign" },
  { label: "Festivals", href: "/festivals" },
  { label: "Media Contacts", href: "/media-contacts" },
  { label: "Publish", href: "/publish" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="tabs" aria-label="Primary">
      {NAV_PAGES.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link key={href} href={href} className={isActive ? "active" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
