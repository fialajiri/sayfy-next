import Image from "next/image";
import Link from "next/link";
import logo from "@/../public/brand/sayfy-logo.webp";

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-full">
      <Image
        src={logo}
        alt=""
        width={52}
        height={52}
        priority
        className="size-12 lg:size-13"
      />
      <span className="font-display-upper text-xl leading-none italic">
        Sayfyho
        <br />
        <span className="text-sayfy-300">Memorial</span>
      </span>
      <span className="sr-only">– úvodní stránka</span>
    </Link>
  );
}
