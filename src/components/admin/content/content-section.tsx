import type { ReactNode } from "react";

type ContentSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ContentSection({
  title,
  description,
  children,
}: ContentSectionProps) {
  return (
    <section className="bg-card space-y-5 rounded-xl border p-5 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}
