"use client";

import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/../public/brand/sayfy-logo.webp";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ADMIN_NAV, isAdminPathActive } from "./admin-nav";
import { LogoutButton } from "./logout-button";

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-3 rounded-lg p-2">
          <Image src={logo} alt="" width={36} height={36} />
          <span className="font-display-upper leading-none italic">
            Sayfyho Memorial
            <span className="text-muted-foreground block font-sans text-xs font-normal tracking-normal normal-case not-italic">
              Administrace
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {ADMIN_NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ href, label, icon: Icon, phase }) => (
                  <SidebarMenuItem key={href}>
                    {phase ? (
                      <SidebarMenuButton
                        disabled
                        aria-disabled="true"
                        className="opacity-55"
                      >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        isActive={isAdminPathActive(pathname, href)}
                        render={<Link href={href} />}
                      >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    )}
                    {phase && <SidebarMenuBadge>brzy</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/" target="_blank" rel="noopener" />}
            >
              <ExternalLinkIcon aria-hidden="true" />
              <span>Zobrazit web</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-muted-foreground truncate px-2 text-xs">{email}</p>
      </SidebarFooter>
    </Sidebar>
  );
}
