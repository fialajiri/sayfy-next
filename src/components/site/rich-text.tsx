import { sanitizeRichText } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

// Stored editor HTML. dangerouslySetInnerHTML is unavoidable for rich text, so
// it is ALWAYS sanitized first (legacy rows were stored raw) — docs/08 §A3.
// Styles live in globals.css `.rich-text`, shared with the admin editor.
export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("rich-text max-w-prose", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
