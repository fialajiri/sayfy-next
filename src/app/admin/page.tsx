import {
  ArrowUpRightIcon,
  ImagesIcon,
  NewspaperIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { daysLabel, formatDateLong } from "@/lib/dates";
import { requireAdminPage } from "@/server/actions/guards";
import { listGalleries } from "@/server/application/galleries";
import { listNews } from "@/server/application/news";
import { getRaceOverview, type RaceOverview } from "@/server/application/race";
import { container } from "@/server/container";

export const metadata = { title: "Přehled" };

function raceStatusText(race: RaceOverview): string {
  const { status } = race;
  if (status.kind === "upcoming") {
    return `Do startu ${race.edition ?? ""}. ročníku (${formatDateLong(status.start)}) zbývá ${status.daysLeft} ${daysLabel(status.daysLeft)}.`;
  }
  if (status.kind === "raceDay") return "Dnes se závodí! Start v 11:00.";
  return `Závod ${status.year} proběhl. Web teď ukazuje poděkování a odkaz na výsledky.`;
}

export default async function AdminDashboardPage() {
  await requireAdminPage("/admin");
  const [race, news, galleries] = await Promise.all([
    getRaceOverview(
      { settings: container.settings, results: container.results },
      new Date(),
    ),
    listNews(container.news, 1),
    listGalleries(container.galleries),
  ]);

  const stats = [
    {
      label: "Aktuality",
      value: news.ok ? news.value.total : "–",
      Icon: NewspaperIcon,
    },
    {
      label: "Fotogalerie",
      value: galleries.ok ? galleries.value.length : "–",
      Icon: ImagesIcon,
    },
    {
      label: "Ročníky s výsledky",
      value: race.results.length,
      Icon: TrophyIcon,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Přehled"
        description="Vítejte v administraci Sayfyho Memorial."
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Závod</CardTitle>
            <CardDescription>
              Každý rok 28. září v 11:00, Královské město Hrob.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{raceStatusText(race)}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">Registrace:</span>
              <Badge variant={race.registration.open ? "default" : "secondary"}>
                {race.registration.open ? "otevřená" : "uzavřená"}
              </Badge>
              <a
                href={race.registration.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
              >
                odkaz na sportt.cz{" "}
                <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
              </a>
            </div>
            <p className="text-muted-foreground text-sm">
              Přepínání registrace a odkazu přibude ve fázi 5 (Nastavení
              závodu).
            </p>
          </CardContent>
        </Card>
        <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(({ label, value, Icon }) => (
            <li
              key={label}
              className="bg-card flex items-center gap-4 rounded-xl border p-4"
            >
              <Icon className="text-sayfy-700 size-6" aria-hidden="true" />
              <div>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {value}
                </p>
                <p className="text-muted-foreground text-sm">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-muted-foreground mt-10 text-sm">
        Úpravy obsahu (aktuality, galerie, propozice, výsledky, partneři a texty
        stránek) postupně přibývají — viz{" "}
        <Link href="/" className="text-primary hover:underline">
          web
        </Link>
        .
      </p>
    </>
  );
}
