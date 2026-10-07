import {
  FileTextIcon,
  HandshakeIcon,
  HomeIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  NewspaperIcon,
  SettingsIcon,
  TrophyIcon,
  UserCogIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  phase?: number;
};
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

// `phase` marks sections not built yet (docs/07): shown disabled as "brzy".
export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    label: "Přehled",
    items: [{ href: "/admin", label: "Přehled", icon: LayoutDashboardIcon }],
  },
  {
    label: "Obsah",
    items: [
      {
        href: "/admin/aktuality",
        label: "Aktuality",
        icon: NewspaperIcon,
      },
      {
        href: "/admin/fotogalerie",
        label: "Fotogalerie",
        icon: ImagesIcon,
      },
      {
        href: "/admin/propozice",
        label: "Propozice",
        icon: FileTextIcon,
      },
      {
        href: "/admin/vysledky",
        label: "Výsledky",
        icon: TrophyIcon,
        phase: 5,
      },
      {
        href: "/admin/partneri",
        label: "Partneři",
        icon: HandshakeIcon,
        phase: 5,
      },
    ],
  },
  {
    label: "Stránky",
    items: [
      {
        href: "/admin/obsah/uvod",
        label: "Úvod, Sayfy, Kontakt…",
        icon: HomeIcon,
        phase: 5,
      },
    ],
  },
  {
    label: "Nastavení",
    items: [
      {
        href: "/admin/nastaveni",
        label: "Nastavení závodu",
        icon: SettingsIcon,
        phase: 5,
      },
      { href: "/admin/ucet", label: "Můj účet", icon: UserCogIcon },
    ],
  },
];

export function isAdminPathActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
