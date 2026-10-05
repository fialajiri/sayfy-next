"use client";

import { Button } from "@/components/ui/button";

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  function handleRetry() {
    reset();
  }

  return (
    <section className="max-w-content mx-auto flex min-h-[50svh] flex-col justify-center gap-5 px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display-upper text-display-2">Něco se pokazilo</h1>
      <p className="text-muted-foreground text-lg">
        Stránku se nepodařilo načíst. Zkuste to prosím znovu.
      </p>
      <Button size="xl" className="w-fit" onClick={handleRetry}>
        Zkusit znovu
      </Button>
    </section>
  );
}
