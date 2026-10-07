import { PlusIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ImportLegacyButton } from "@/components/admin/partners/import-legacy-button";
import { PartnerDialog } from "@/components/admin/partners/partner-dialog";
import { PartnerList } from "@/components/admin/partners/partner-list";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/server/actions/guards";
import { container } from "@/server/container";

export const metadata = { title: "Partneři" };

export default async function AdminPartnersPage() {
  await requireAdminPage("/admin/partneri");
  const partners = await container.partners.listRaw();

  return (
    <>
      <AdminPageHeader
        title="Partneři"
        description="Loga na stránce Podpora a na úvodní stránce, v tomto pořadí."
        actions={
          <PartnerDialog
            id={null}
            defaults={{ name: "", logoUrl: "", url: "" }}
            trigger={
              <Button size="lg">
                <PlusIcon data-icon="inline-start" />
                Přidat partnera
              </Button>
            }
          />
        }
      />
      {partners.length === 0 ? (
        <div className="bg-card space-y-4 rounded-xl border p-6">
          <p>
            Zatím nejsou založeni žádní partneři — web zatím ukazuje původní
            loga.
          </p>
          <ImportLegacyButton />
        </div>
      ) : (
        <PartnerList partners={partners} />
      )}
    </>
  );
}
