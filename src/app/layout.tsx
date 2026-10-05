import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { siteUrl } from "@/lib/site-url";
import { getPageContent } from "@/server/application/page-content";
import { container } from "@/server/container";
import { fontVariables } from "./fonts";
import "./globals.css";

// SEO defaults come from the admin-editable pagecontent "site" (legacy
// _document.tsx copy by default — docs/08 §B1). Pages override title etc.
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getPageContent(container.pageContent, "site");
  return {
    metadataBase: siteUrl(),
    title: { default: "Sayfyho Memorial", template: "%s · Sayfyho Memorial" },
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      type: "website",
      locale: "cs_CZ",
      siteName: "Sayfyho Memorial",
      images: [{ url: seo.ogImage.url, alt: seo.ogImage.alt }],
    },
  };
}

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
