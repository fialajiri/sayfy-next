import { ExternalLinkIcon, PencilIcon, PlusIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteResultButton } from "@/components/admin/results/delete-result-button";
import { ResultDialog } from "@/components/admin/results/result-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminPage } from "@/server/actions/guards";
import { listResults } from "@/server/application/race";
import { container } from "@/server/container";

export const metadata = { title: "Výsledky" };

export default async function AdminResultsPage() {
  await requireAdminPage("/admin/vysledky");
  const result = await listResults(container.results);
  if (!result.ok) throw new Error(result.error.message);
  const latest = result.value[0];
  const next = latest
    ? { year: latest.year + 1, edition: latest.edition + 1, url: "", note: "" }
    : { year: new Date().getFullYear(), edition: 1, url: "", note: "" };

  return (
    <>
      <AdminPageHeader
        title="Výsledky"
        description="Odkazy na výsledkové listiny jednotlivých ročníků."
        actions={
          <ResultDialog
            id={null}
            defaults={next}
            trigger={
              <Button size="lg">
                <PlusIcon data-icon="inline-start" />
                Přidat výsledky
              </Button>
            }
          />
        }
      />
      <div className="bg-card overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Rok</TableHead>
              <TableHead className="w-24">Ročník</TableHead>
              <TableHead>Odkaz</TableHead>
              <TableHead className="w-28 text-right">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.value.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono font-semibold">
                  {item.year}
                </TableCell>
                <TableCell>{item.edition}.</TableCell>
                <TableCell className="max-w-md">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 break-all hover:underline"
                  >
                    {item.url.replace(/^https:\/\//, "")}{" "}
                    <ExternalLinkIcon
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                  {!item.embeddable && (
                    <Badge variant="outline" className="ml-2">
                      jen odkaz
                    </Badge>
                  )}
                  {item.note && (
                    <p className="text-muted-foreground text-xs">{item.note}</p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <ResultDialog
                    id={item.id}
                    defaults={{
                      year: item.year,
                      edition: item.edition,
                      url: item.url,
                      note: item.note ?? "",
                    }}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Upravit výsledky ${item.year}`}
                      >
                        <PencilIcon />
                      </Button>
                    }
                  />
                  <DeleteResultButton id={item.id} year={item.year} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
