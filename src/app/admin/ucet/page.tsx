import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireAdminPage } from "@/server/actions/guards";

export const metadata = { title: "Můj účet" };

export default async function AccountPage() {
  const admin = await requireAdminPage("/admin/ucet");
  return (
    <>
      <AdminPageHeader
        title="Můj účet"
        description={`Přihlášen jako ${admin.email}`}
      />
      <section
        aria-labelledby="password-heading"
        className="bg-card space-y-6 rounded-2xl border p-6"
      >
        <h2 id="password-heading" className="text-lg font-semibold">
          Změna hesla
        </h2>
        <ChangePasswordForm email={admin.email} />
      </section>
    </>
  );
}
