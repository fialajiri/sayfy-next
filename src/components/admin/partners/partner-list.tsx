"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, type MouseEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deletePartnerAction,
  reorderPartnersAction,
} from "@/server/actions/partners";
import type { PartnerRecord } from "@/server/domain/partner";
import { PartnerDialog } from "./partner-dialog";

export function PartnerList({ partners }: { partners: PartnerRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ordered, setOrdered] = useOptimistic(partners);

  function handleMove(event: MouseEvent<HTMLButtonElement>) {
    const from = Number(event.currentTarget.dataset.index);
    const to = from + Number(event.currentTarget.dataset.delta);
    if (to < 0 || to >= ordered.length) return;
    const next = [...ordered];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    startTransition(async () => {
      setOrdered(next);
      const result = await reorderPartnersAction(next.map((p) => p.id));
      if (!result.ok) toast.error(result.message);
      router.refresh();
    });
  }

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    const { id, name } = event.currentTarget.dataset;
    if (!id) return;
    startTransition(async () => {
      const result = await deletePartnerAction(id);
      if (!result.ok) toast.error(result.message);
      else toast.success(`Partner „${name}“ smazán.`);
      router.refresh();
    });
  }

  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((partner, i) => (
        <li
          key={partner.id}
          className="bg-card flex flex-col overflow-hidden rounded-xl border"
        >
          <div className="flex aspect-[3/2] items-center justify-center bg-white p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a logo */}
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{partner.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {partner.url || "bez odkazu"}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                data-index={i}
                data-delta={-1}
                onClick={handleMove}
                disabled={pending || i === 0}
                aria-label={`Posunout „${partner.name}“ dopředu`}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                data-index={i}
                data-delta={1}
                onClick={handleMove}
                disabled={pending || i === ordered.length - 1}
                aria-label={`Posunout „${partner.name}“ dozadu`}
              >
                <ChevronRightIcon />
              </Button>
              <PartnerDialog
                id={partner.id}
                defaults={{
                  name: partner.name,
                  logoUrl: partner.logoUrl,
                  url: partner.url,
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Upravit „${partner.name}“`}
                  >
                    <PencilIcon />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                data-id={partner.id}
                data-name={partner.name}
                onClick={handleDelete}
                disabled={pending}
                aria-label={`Smazat „${partner.name}“`}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
