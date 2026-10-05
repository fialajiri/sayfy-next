import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PartnerDto } from "@/server/domain/partner";

type PartnerWallProps = { partners: PartnerDto[]; compact?: boolean };

function PartnerLogo({ partner }: { partner: PartnerDto }) {
  return (
    <Image
      src={partner.logoUrl}
      alt={partner.name}
      fill
      sizes="(min-width: 1024px) 15vw, 30vw"
      className="object-contain p-4 grayscale transition duration-(--duration-ui) group-hover:grayscale-0 group-focus-visible:grayscale-0"
    />
  );
}

export function PartnerWall({ partners, compact = false }: PartnerWallProps) {
  return (
    <ul
      className={cn(
        "grid gap-3",
        compact
          ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-9"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {partners.map((partner) => {
        const box = cn(
          "group relative block rounded-xl border bg-white",
          compact ? "aspect-[3/2]" : "aspect-[4/3]",
        );
        return (
          <li key={partner.id}>
            {partner.url ? (
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className={box}
              >
                <PartnerLogo partner={partner} />
                <span className="sr-only">(otevře se v novém okně)</span>
              </a>
            ) : (
              <div className={box}>
                <PartnerLogo partner={partner} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
