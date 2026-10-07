import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { requireAdminPage } from "@/server/actions/guards";
import { getRaceOverview, getSettings } from "@/server/application/race";
import { container } from "@/server/container";
import { editionFor } from "@/server/domain/race-status";

export const metadata = { title: "Nastavení závodu" };

export default async function SettingsPage() {
  await requireAdminPage("/admin/nastaveni");
  const [settings, race] = await Promise.all([
    getSettings(container.settings),
    getRaceOverview(
      { settings: container.settings, results: container.results },
      new Date(),
    ),
  ]);
  const derived = editionFor(race.status.year, race.results[0] ?? null, null);
  return (
    <>
      <AdminPageHeader
        title="Nastavení závodu"
        description="Registrace a ročník. Změny se na webu projeví hned."
      />
      <SettingsForm defaults={settings} derivedEdition={derived} />
    </>
  );
}
