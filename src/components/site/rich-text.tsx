import { sanitizeRichText } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

// Stored editor HTML. dangerouslySetInnerHTML is unavoidable for rich text, so
// it is ALWAYS sanitized first (legacy rows were stored raw) — docs/08 §A3.
export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-body max-w-prose space-y-5",
        "[&_h2]:font-display-upper [&_h2]:text-display-3 [&_h2]:pt-6",
        "[&_h3]:font-display [&_h3]:pt-4 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:uppercase",
        "[&_h4]:pt-2 [&_h4]:text-lg [&_h4]:font-semibold",
        "[&_a]:text-primary [&_a]:font-medium [&_a]:[overflow-wrap:anywhere] [&_a]:underline [&_a]:underline-offset-3 [&_a:hover]:decoration-2",
        "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
        "[&_li]:marker:text-sayfy-500",
        "[&_blockquote]:border-signal [&_blockquote]:border-l-4 [&_blockquote]:pl-5 [&_blockquote]:italic",
        "[&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl",
        "[&_figcaption]:text-muted-foreground [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm",
        "[&_hr]:border-border [&_hr]:my-10",
        "[&_table]:block [&_table]:max-w-full [&_table]:border-collapse [&_table]:overflow-x-auto [&_table]:text-sm",
        "[&_td]:border-border [&_th]:bg-muted [&_th]:border-border [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left",
        "[&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:rounded-xl",
        "[&_mark]:bg-signal/60 [&_mark]:text-ink [&_mark]:rounded-sm [&_mark]:px-0.5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
