import { LogOutIcon } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { logoutAction } from "@/server/actions/auth";

// A plain form: works without JavaScript; the action redirects to the login.
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SidebarMenuButton type="submit">
        <LogOutIcon aria-hidden="true" />
        <span>Odhlásit se</span>
      </SidebarMenuButton>
    </form>
  );
}
