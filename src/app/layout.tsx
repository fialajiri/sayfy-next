import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { siteUrl } from "@/lib/site-url";
import { fontVariables } from "./fonts";
import "./globals.css";

// Defaults carried over from the legacy _document.tsx; editable via
// pagecontent "site" from Phase 1 (docs/08 §B1).
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Sayfyho Memorial",
    template: "%s · Sayfyho Memorial",
  },
  description: "Domovská stránka cyklistického závodu Sayfyho Memorial",
  keywords: [
    "Sayfyho Memorial",
    "cyklistický závod",
    "Sayfy",
    "Teplice",
    "Město Hrob",
    "kola",
    "cyklistika",
    "závody",
  ],
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "Sayfyho Memorial",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="cs"
      className={`${fontVariables} antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
