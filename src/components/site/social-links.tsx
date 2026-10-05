import { cn } from "@/lib/utils";
import {
  DEFAULT_SOCIAL_LINKS,
  type SocialLinks as SocialLinksData,
} from "./navigation";
import { FacebookIcon, InstagramIcon } from "./social-icons";

type SocialLinksProps = { links?: SocialLinksData; className?: string };

export function SocialLinks({
  links = DEFAULT_SOCIAL_LINKS,
  className,
}: SocialLinksProps) {
  const items = [
    { href: links.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: links.instagramUrl, label: "Instagram", Icon: InstagramIcon },
  ].filter((item) => item.href !== "");

  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {items.map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/75 hover:text-foreground inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/5"
          >
            <Icon className="size-5" />
            <span className="sr-only">{label} (otevře se v novém okně)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
