import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import logo from "@/../public/brand/sayfy-logo.webp";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { safeAdminRedirect } from "@/server/actions/redirect-target";

export const metadata: Metadata = {
  title: "Přihlášení",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/prihlaseni">) {
  const next = safeAdminRedirect((await searchParams).next);
  const session = await auth();
  if (session?.user.isAdmin) redirect(next);

  return (
    <div className="bg-card shadow-float w-full max-w-sm space-y-8 rounded-3xl border p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Link href="/" className="rounded-full">
          <Image
            src={logo}
            alt="Sayfyho Memorial – úvodní stránka"
            width={72}
            height={72}
            priority
          />
        </Link>
        <h1 className="font-display-upper text-display-3 italic">
          Administrace
        </h1>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
