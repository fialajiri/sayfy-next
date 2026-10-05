import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
};

// Consistent dark page intro for every public section (docs/06 §9).
export function PageHeader({
  kicker,
  title,
  lead,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("dark bg-asphalt-950 text-foreground", className)}>
      <div className="max-w-wide mx-auto px-4 pt-14 pb-12 sm:px-6 lg:px-8 lg:pt-20 lg:pb-16">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="font-display-upper text-display-1 mt-4 italic">
          {title}
        </h1>
        {lead && (
          <div className="text-muted-foreground mt-5 max-w-2xl text-lg">
            {lead}
          </div>
        )}
        {children}
      </div>
    </header>
  );
}
