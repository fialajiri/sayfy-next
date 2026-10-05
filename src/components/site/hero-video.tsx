"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

type HeroVideoProps = { mp4Url: string; webmUrl: string; posterUrl: string };

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mql = window.matchMedia(REDUCED_MOTION);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

// Muted background loop. Never autoplays with reduced motion; always offers a
// pause control (WCAG 2.2.2). The poster is the LCP image either way.
export function HeroVideo({ mp4Url, webmUrl, posterUrl }: HeroVideoProps) {
  const video = useRef<HTMLVideoElement>(null);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true, // server: assume reduced motion → no autoplay attribute in HTML
  );
  const [userPaused, setUserPaused] = useState(false);
  const playing = !reduceMotion && !userPaused;

  // `autoPlay` flipping to true after hydration doesn't start playback, so the
  // ref callback (re-run each render) starts it once motion is allowed.
  function attachVideo(el: HTMLVideoElement | null) {
    video.current = el;
    if (el && playing && el.paused) void el.play().catch(() => undefined);
  }

  function handleToggle() {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setUserPaused(false);
    } else {
      el.pause();
      setUserPaused(true);
    }
  }

  return (
    <>
      <video
        ref={attachVideo}
        className="absolute inset-0 size-full object-cover"
        poster={posterUrl}
        muted
        loop
        playsInline
        autoPlay={playing}
        preload={playing ? "auto" : "none"}
        aria-hidden="true"
        tabIndex={-1}
      >
        {webmUrl && <source src={webmUrl} type="video/webm" />}
        <source src={mp4Url} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={handleToggle}
        className="absolute right-4 bottom-4 z-10 inline-flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-6 sm:bottom-6"
      >
        {playing ? (
          <PauseIcon className="size-5" aria-hidden="true" />
        ) : (
          <PlayIcon className="size-5" aria-hidden="true" />
        )}
        <span className="sr-only">
          {playing ? "Pozastavit video" : "Přehrát video"}
        </span>
      </button>
    </>
  );
}
