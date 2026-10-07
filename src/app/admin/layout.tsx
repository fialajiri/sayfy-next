import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireAdminPage } from "@/server/actions/guards";

export const metadata: Metadata = {
  title: { default: "Administrace", template: "%s · Administrace" },
  robots: { index: false, follow: false },
};

// The layout check is only for the shell — each admin page calls
// requireAdminPage() itself too (layouts don't re-run on navigation).
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdminPage("/admin");
  return (
    <SidebarProvider>
      <AdminSidebar email={admin.email} />
      <SidebarInset className="light bg-paper">
        <header className="bg-background/90 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <span className="font-display-upper italic">Administrace</span>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
