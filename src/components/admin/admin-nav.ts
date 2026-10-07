import {
  FileTextIcon,
  GlobeIcon,
  HandHeartIcon,
  HandshakeIcon,
  HeartIcon,
  HomeIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  MailIcon,
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
      },
      {
        href: "/admin/partneri",
        label: "Partneři",
        icon: HandshakeIcon,
      },
    ],
  },
  {
    label: "Stránky",
    items: [
      { href: "/admin/obsah/uvod", label: "Úvodní stránka", icon: HomeIcon },
      { href: "/admin/obsah/sayfy", label: "Kdo byl Sayfy", icon: HeartIcon },
      { href: "/admin/obsah/kontakt", label: "Kontakt", icon: MailIcon },
      { href: "/admin/obsah/podpora", label: "Podpora", icon: HandHeartIcon },
      { href: "/admin/obsah/web", label: "Celý web", icon: GlobeIcon },
    ],
  },
  {
    label: "Nastavení",
    items: [
      {
        href: "/admin/nastaveni",
        label: "Nastavení závodu",
        icon: SettingsIcon,
      },
      { href: "/admin/ucet", label: "Můj účet", icon: UserCogIcon },
    ],
  },
];

export function isAdminPathActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
