import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";

// Czech needs latin-ext (ě š č ř ž ů …); without it glyphs fall back mid-word.
// next/font requires these options as inline literals (statically analysed).

export const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const fontVariables = [
  geist.variable,
  geistMono.variable,
  barlowCondensed.variable,
].join(" ");
