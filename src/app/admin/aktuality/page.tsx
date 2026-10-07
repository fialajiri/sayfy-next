import {
  ExternalLinkIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteNewsButton } from "@/components/admin/news/delete-news-button";
import { PageNav } from "@/components/site/page-nav";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { requireAdminPage } from "@/server/actions/guards";
import { listNews } from "@/server/application/news";
import { container } from "@/server/container";

export const metadata = { title: "Aktuality" };

export default async function AdminNewsPage({
  searchParams,
}: PageProps<"/admin/aktuality">) {
  await requireAdminPage("/admin/aktuality");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const page = Number(params.strana) > 0 ? Number(params.strana) : 1;
  const result = await listNews(container.news, q ? 1 : page, q ? 1000 : 20);
  if (!result.ok) throw new Error(result.error.message);
  const items = q
    ? result.value.items.filter((n) => n.title.toLowerCase().includes(q))
    : result.value.items;

  return (
    <>
      <AdminPageHeader
        title="Aktuality"
        description={`${result.value.total} aktualit`}
        actions={
          <Link
            href="/admin/aktuality/nova"
            className={buttonVariants({ size: "lg" })}
          >
            <PlusIcon data-icon="inline-start" />
            Nová aktualita
          </Link>
        }
      />
      <form role="search" className="relative mb-6 max-w-sm">
        <SearchIcon
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Hledat podle nadpisu…"
          aria-label="Hledat aktuality"
          className="pl-9"
        />
      </form>
      <div className="bg-card overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Obrázek</TableHead>
              <TableHead>Nadpis</TableHead>
              <TableHead className="w-28">Datum</TableHead>
              <TableHead className="w-32 text-right">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-10 text-center"
                >
                  Nic nenalezeno.
                </TableCell>
              </TableRow>
            )}
            {items.map((news) => (
              <TableRow key={news.id}>
                <TableCell>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  <img
                    src={news.mainPhoto}
                    alt=""
                    className="aspect-[4/3] w-16 rounded object-cover"
                    loading="lazy"
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/aktuality/${news.id}`}
                    className="font-medium hover:underline"
                  >
                    {news.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    /aktuality/{news.slug}
                  </p>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatDate(news.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/aktuality/${news.id}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon-sm",
                    })}
                    aria-label={`Upravit „${news.title}“`}
                  >
                    <PencilIcon />
                  </Link>
                  <a
                    href={`/aktuality/${encodeURIComponent(news.slug)}`}
                    target="_blank"
                    rel="noopener"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon-sm",
                    })}
                    aria-label={`Zobrazit „${news.title}“ na webu`}
                  >
                    <ExternalLinkIcon />
                  </a>
                  <DeleteNewsButton id={news.id} title={news.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!q && (
        <div className="mt-6">
          <PageNav
            page={result.value.page}
            pageCount={result.value.pageCount}
            hrefFor={(p) => `/admin/aktuality?strana=${p}`}
          />
        </div>
      )}
    </>
  );
}
