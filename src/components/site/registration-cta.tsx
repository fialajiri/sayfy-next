import { ArrowUpRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RegistrationCtaProps = { open: boolean; url: string; className?: string };

// Settings-driven (replaces the legacy hard-coded register button).
export function RegistrationCta({
  open,
  url,
  className,
}: RegistrationCtaProps) {
  if (!open) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "signal", size: "xl" }),
        className,
      )}
    >
      Registrace
      <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
      <span className="sr-only">(otevře se v novém okně)</span>
    </a>
  );
}
