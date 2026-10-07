// Accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID.
export function youtubeId(input: string): string | null {
  if (!URL.canParse(input.trim())) return null;
  const url = new URL(input.trim());
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      url.searchParams.get("v") ??
      /^\/(?:shorts|embed|live)\/([\w-]+)/.exec(url.pathname)?.[1] ??
      null;
  }
  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}
