import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="dark bg-asphalt-950 text-foreground">
      <div className="max-w-content mx-auto flex min-h-[60svh] flex-col justify-center gap-6 px-4 py-20 sm:px-6 lg:px-8">
        <p className="kicker">404</p>
        <h1 className="font-display-upper text-display-1 italic">
          Tady trať nevede.
        </h1>
        <p className="text-muted-foreground text-lg">
          Stránka neexistuje nebo byla přesunuta.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className={buttonVariants({ variant: "signal", size: "xl" })}
          >
            Na úvod
          </Link>
          <Link
            href="/aktuality"
            className={buttonVariants({ variant: "outline", size: "xl" })}
          >
            Aktuality
          </Link>
        </div>
      </div>
    </section>
  );
}
